"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import {
    calculateEstimate,
    getRemovalOption,
    getService,
    getServiceOption,
    isRemovalOnly,
    requiresDesignTier,
} from "@/features/bookings/new-booking/utils";
import {
    normalizeInstagramHandle,
    validateInstagramHandle,
} from "@/features/profile/validation/profile";
import { isValidEmail } from "@/features/auth/validation/email";
import { appointmentStatusTemplate } from "@/features/notifications/email/templates/appointment-status-template";
import { resolveBookingRecipient } from "@/features/notifications/utils/resolve-booking-recipient";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { getAppBaseUrl } from "@/lib/email/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingSelections, DesignTier } from "@/features/bookings/new-booking/types";
import type { Database, Enums } from "@/types/supabase";
import { syncBookingToGoogleCalendar } from "@/features/integrations/google-calendar/services/sync";

type BookingLineItemInsert =
    Database["public"]["Tables"]["booking_line_items"]["Insert"];

type CreateState = {
    error: string;
    success: string;
    messageId: string;
    bookingId?: string;
};

export type AdminCreateAppointmentState = CreateState;

const BOOKING_REFERENCE_PREFIX = "VEE";
const BOOKING_REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BOOKING_REFERENCE_LENGTH = 6;

function response(input: Omit<CreateState, "messageId">): CreateState {
    return {
        ...input,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

function text(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function generateReferenceCode(length = BOOKING_REFERENCE_LENGTH) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    return Array.from(values)
        .map((value) => BOOKING_REFERENCE_ALPHABET[value % BOOKING_REFERENCE_ALPHABET.length])
        .join("");
}

async function generateBookingReference(admin: ReturnType<typeof createAdminClient>) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const bookingReference = `${BOOKING_REFERENCE_PREFIX}-${generateReferenceCode()}`;
        const { data, error } = await admin
            .from("bookings")
            .select("id")
            .eq("booking_reference", bookingReference)
            .maybeSingle();

        if (error) throw error;
        if (!data) return bookingReference;
    }

    throw new Error("Unable to generate booking reference.");
}

function buildServiceLineItemLabel(
    service: NonNullable<ReturnType<typeof getService>>,
    serviceOption: NonNullable<ReturnType<typeof getServiceOption>>,
) {
    if (service.id === "freestyle") return service.label;
    const optionLabel =
        serviceOption.groupLabel && service.id === "structured_gel_manicure"
            ? `${serviceOption.groupLabel} ${serviceOption.label}`
            : serviceOption.label;
    return `${service.label} • ${optionLabel}`;
}

function parseSelections(formData: FormData): BookingSelections {
    const removalId = text(formData, "removalId");
    const serviceId = text(formData, "serviceId");
    const serviceOptionId = text(formData, "serviceOptionId");
    const designTierId = text(formData, "designTierId");

    return {
        slotId: text(formData, "slotId") || null,
        removalId: removalId ? (removalId as BookingSelections["removalId"]) : null,
        serviceId: serviceId ? (serviceId as BookingSelections["serviceId"]) : null,
        serviceOptionGroupId: null,
        serviceOptionId: serviceOptionId || null,
        designTierId: designTierId || null,
    };
}

function normalizeDesignTierLabel(label: string) {
    if (/^design tier/i.test(label)) return label;
    if (/^tier\s+/i.test(label)) return `Design ${label}`;
    return label;
}

function buildLineItems({
    bookingId,
    adminUserId,
    selections,
    designTier,
}: {
    bookingId: string;
    adminUserId: string;
    selections: BookingSelections;
    designTier: { id: string; name: string; description: string | null; price: number } | null;
}): BookingLineItemInsert[] {
    const removal = getRemovalOption(selections.removalId);
    const service = getService(selections.serviceId);
    const serviceOption = getServiceOption(service, selections.serviceOptionId);
    const items: BookingLineItemInsert[] = [];

    if (removal && removal.price > 0) {
        items.push({
            booking_id: bookingId,
            item_type: "removal",
            label_snapshot: removal.label,
            description_snapshot: removal.description,
            quantity: 1,
            unit_price: removal.price,
            added_by: adminUserId,
        });
    }

    if (!isRemovalOnly(selections.removalId) && service && serviceOption) {
        items.push({
            booking_id: bookingId,
            item_type: "service",
            source_table: "booking_config",
            source_id: `${service.id}:${serviceOption.id}`,
            label_snapshot: buildServiceLineItemLabel(service, serviceOption),
            description_snapshot: serviceOption.helperText ?? service.description,
            quantity: 1,
            unit_price: serviceOption.price,
            added_by: adminUserId,
        });
    }

    if (
        !isRemovalOnly(selections.removalId) &&
        requiresDesignTier(service) &&
        designTier
    ) {
        items.push({
            booking_id: bookingId,
            item_type: "design_tier",
            source_table: "design_tiers",
            source_id: designTier.id,
            label_snapshot: normalizeDesignTierLabel(designTier.name),
            description_snapshot: designTier.description,
            quantity: 1,
            unit_price: designTier.price,
            added_by: adminUserId,
        });
    }

    return items;
}

export async function createAdminAppointmentAction(
    _previous: AdminCreateAppointmentState,
    formData: FormData,
): Promise<AdminCreateAppointmentState> {
    const { user: adminUser } = await requireAdmin();
    const admin = createAdminClient();
    const mode = text(formData, "clientMode") === "external" ? "external" : "existing";
    const selectedUserId = text(formData, "userId");
    const externalName = text(formData, "clientDisplayName");
    const externalEmail = text(formData, "clientEmail").toLowerCase();
    const externalInstagramRaw = text(formData, "clientInstagramHandle");
    const externalInstagram = normalizeInstagramHandle(externalInstagramRaw);
    const preferredContactInput = text(
        formData,
        "clientPreferredContactMethod",
    );
    const preferredContact =
        preferredContactInput === "email" && externalEmail
            ? "email"
            : preferredContactInput === "instagram" && externalInstagram
              ? "instagram"
              : externalEmail
                ? "email"
                : "instagram";
    const bookingStatus = text(formData, "bookingStatus") === "confirmed" ? "confirmed" : "requested";
    const depositStatusInput = text(formData, "depositStatus") as Enums<"deposit_status">;
    const depositStatus: Enums<"deposit_status"> =
        depositStatusInput === "received"
            ? "received"
            : depositStatusInput === "marked_sent"
              ? "marked_sent"
              : "pending";
    const selections = parseSelections(formData);

    if (!selections.slotId) return response({ error: "Choose an appointment time.", success: "" });

    if (mode === "existing" && !selectedUserId) {
        return response({ error: "Choose an existing customer.", success: "" });
    }

    if (mode === "external") {
        if (!externalName) return response({ error: "Add the external client's name.", success: "" });
        if (!externalEmail && !externalInstagram) {
            return response({
                error: "Add an email address or Instagram handle so the client can be contacted.",
                success: "",
            });
        }
        const instagramError = externalInstagramRaw
            ? validateInstagramHandle(externalInstagramRaw)
            : null;
        if (instagramError) return response({ error: instagramError, success: "" });
        if (externalEmail && !isValidEmail(externalEmail)) return response({ error: "Enter a valid email or leave it blank.", success: "" });
    }

    const removal = getRemovalOption(selections.removalId);
    const service = getService(selections.serviceId);
    const serviceOption = getServiceOption(service, selections.serviceOptionId);
    if (!removal) return response({ error: "Choose a removal option.", success: "" });
    if (!isRemovalOnly(selections.removalId) && (!service || !serviceOption)) {
        return response({ error: "Choose a valid service and option.", success: "" });
    }
    if (
        !isRemovalOnly(selections.removalId) &&
        requiresDesignTier(service) &&
        !selections.designTierId
    ) {
        return response({ error: "Choose a design tier.", success: "" });
    }

    let createdBookingId: string | null = null;

    try {
        const { data: slot, error: slotError } = await admin
            .from("availability_slots")
            .update({ status: bookingStatus === "confirmed" ? "confirmed" : "requested" })
            .eq("id", selections.slotId)
            .eq("active", true)
            .eq("status", "available")
            .select("id, starts_at, ends_at")
            .maybeSingle()
            .overrideTypes<{ id: string; starts_at: string; ends_at: string | null } | null>();

        if (slotError) throw slotError;
        if (!slot) return response({ error: "That appointment time is no longer available.", success: "" });

        let profile: {
            id: string;
            display_name: string;
            email: string;
            instagram_handle: string | null;
            preferred_contact_method: string | null;
        } | null = null;
        if (mode === "existing") {
            const result = await admin
                .from("profiles")
                .select("id, display_name, email, instagram_handle, preferred_contact_method")
                .eq("id", selectedUserId)
                .maybeSingle()
                .overrideTypes<{
                    id: string;
                    display_name: string;
                    email: string;
                    instagram_handle: string | null;
                    preferred_contact_method: string | null;
                } | null>();
            if (result.error) throw result.error;
            if (!result.data) throw new Error("Selected customer was not found.");
            profile = result.data;
        }

        const [settingsResult, tiersResult] = await Promise.all([
            admin
                .from("booking_settings")
                .select("deposit_amount, booking_fee_mode, booking_fee_rate, hold_minutes")
                .eq("id", 1)
                .maybeSingle()
                .overrideTypes<{
                    deposit_amount: number;
                    booking_fee_mode: Enums<"fee_mode">;
                    booking_fee_rate: number;
                    hold_minutes: number;
                } | null>(),
            requiresDesignTier(service)
                ? admin
                      .from("design_tiers")
                      .select("id, name, description, price")
                      .eq("active", true)
                      .overrideTypes<
                          Array<{
                              id: string;
                              name: string;
                              description: string | null;
                              price: number;
                          }>
                      >()
                : Promise.resolve({
                      data: [] as Array<{
                          id: string;
                          name: string;
                          description: string | null;
                          price: number;
                      }>,
                      error: null,
                  }),
        ]);

        if (settingsResult.error || tiersResult.error) throw settingsResult.error ?? tiersResult.error;
        const settings = settingsResult.data;
        if (!settings) throw new Error("Booking settings are missing.");

        const designTier =
            !isRemovalOnly(selections.removalId) &&
            requiresDesignTier(service) &&
            selections.designTierId
                ? (tiersResult.data ?? []).find((tier) => tier.id === selections.designTierId) ?? null
                : null;
        if (
            !isRemovalOnly(selections.removalId) &&
            requiresDesignTier(service) &&
            !designTier
        ) {
            await admin.from("availability_slots").update({ status: "available" }).eq("id", slot.id);
            return response({ error: "Choose a valid design tier.", success: "" });
        }

        const designTiers: DesignTier[] = (tiersResult.data ?? []).map((tier) => ({
            id: tier.id,
            label: tier.name,
            description: tier.description ?? undefined,
            price: Number(tier.price ?? 0),
            imageSrc: null,
            imageAlt: `${tier.name} design tier preview`,
        }));
        const estimate = calculateEstimate(
            selections,
            {
                depositAmount: Number(settings.deposit_amount ?? 0),
                bookingFeeMode: settings.booking_fee_mode,
                bookingFeeRate: Number(settings.booking_fee_rate ?? 0),
                holdMinutes: Number(settings.hold_minutes ?? 0),
            },
            designTiers,
        );
        const bookingReference = await generateBookingReference(admin);

        const { data: booking, error: bookingError } = await admin
            .from("bookings")
            .insert({
                booking_reference: bookingReference,
                user_id: profile?.id ?? null,
                slot_id: slot.id,
                status: bookingStatus,
                deposit_status: depositStatus,
                deposit_amount: Number(settings.deposit_amount ?? 0),
                booking_fee_rate: Number(settings.booking_fee_rate ?? 0),
                booking_fee_mode: settings.booking_fee_mode,
                estimated_total: estimate.total,
                subtotal_amount: estimate.subtotal,
                booking_fee_amount: estimate.bookingFee,
                amount_due: estimate.total,
                final_total: 0,
                client_display_name: mode === "external" ? externalName : null,
                client_email: mode === "external" ? externalEmail || null : null,
                client_instagram_handle: mode === "external" ? externalInstagram : null,
                client_preferred_contact_method: mode === "external" ? preferredContact : null,
            })
            .select("id")
            .single();
        if (bookingError) throw bookingError;
        createdBookingId = booking.id;

        const lineItems = buildLineItems({
            bookingId: booking.id,
            adminUserId: adminUser.id,
            selections,
            designTier: designTier ? { ...designTier, price: Number(designTier.price ?? 0) } : null,
        });
        if (lineItems.length === 0) throw new Error("Appointment needs at least one service or removal.");

        const { error: lineItemError } = await admin.from("booking_line_items").insert(lineItems);
        if (lineItemError) throw lineItemError;

        if (depositStatus !== "pending" && Number(settings.deposit_amount ?? 0) > 0) {
            const { error: paymentError } = await admin.from("booking_payments").insert({
                booking_id: booking.id,
                user_id: profile?.id ?? null,
                payment_type: "deposit",
                method: "etransfer",
                amount: Number(settings.deposit_amount ?? 0),
                status: depositStatus === "received" ? "received" : "marked_sent",
                paid_at: depositStatus === "received" ? new Date().toISOString() : null,
                marked_by: adminUser.id,
                notes: "Admin-created appointment deposit status.",
            });
            if (paymentError) throw paymentError;
        }

        const { error: eventError } = await admin.from("booking_events").insert({
            booking_id: booking.id,
            actor_type: "admin",
            actor_user_id: adminUser.id,
            event_type: "admin_booking_created",
            message: `Admin created appointment for ${
                mode === "external"
                    ? externalName
                    : profile?.display_name ?? "client"
            }.`,
            metadata: {
                mode,
                slotId: slot.id,
                startsAt: slot.starts_at,
                endsAt: slot.ends_at,
                status: bookingStatus,
                depositStatus,
                service:
                    isRemovalOnly(selections.removalId)
                        ? removal.label
                        : service?.label ?? null,
                design:
                    service && !requiresDesignTier(service)
                        ? "Technician-designed freestyle set"
                        : designTier?.name ?? null,
                estimatedTotal: estimate.total,
                clientEmail: mode === "external" ? externalEmail || null : profile?.email ?? null,
                clientInstagramHandle:
                    mode === "external" ? externalInstagram : profile?.instagram_handle ?? null,
            },
        });
        if (eventError) throw eventError;

        revalidatePath("/admin");
        revalidatePath("/admin/appointments");
        revalidatePath(`/admin/appointments/${booking.id}`);
        revalidatePath("/admin/availability");
        if (profile?.id) {
            revalidatePath(`/admin/users/${profile.id}`);
            revalidatePath("/booking");
            revalidatePath("/dashboard");
        }

        const recipient = resolveBookingRecipient({
            client_display_name: externalName,
            client_email: externalEmail,
            client_instagram_handle: externalInstagram,
            client_preferred_contact_method: preferredContact,
            profiles: profile,
        });
        const recipientName = recipient.displayName;
        const siteUrl = getAppBaseUrl();
        const appointment = new Intl.DateTimeFormat("en-CA", {
            dateStyle: "full",
            timeStyle: "short",
        }).format(new Date(slot.starts_at));
        const template = appointmentStatusTemplate({
            name: recipientName,
            reference: bookingReference,
            status: bookingStatus,
            appointment,
            message: "The studio created this appointment for you.",
            detailsUrl: profile?.id && siteUrl ? `${siteUrl}/booking/${bookingReference}` : undefined,
        });
        await sendTransactionalEmail({
            to: { email: recipient.email, name: recipientName },
            ...template,
            notificationType: "admin_booking_created",
            bookingId: booking.id,
            userId: profile?.id,
        });
        await syncBookingToGoogleCalendar(booking.id);

        return response({
            error: "",
            success: `Appointment ${bookingReference} created.`,
            bookingId: booking.id,
        });
    } catch (error) {
        console.error("[admin:create-appointment]", error);
        if (createdBookingId) {
            await Promise.allSettled([
                admin.from("booking_events").delete().eq("booking_id", createdBookingId),
                admin.from("booking_payments").delete().eq("booking_id", createdBookingId),
                admin.from("booking_line_items").delete().eq("booking_id", createdBookingId),
            ]);
            await admin.from("bookings").delete().eq("id", createdBookingId);
        }
        if (selections.slotId) {
            await admin
                .from("availability_slots")
                .update({ status: "available" })
                .eq("id", selections.slotId)
                .in("status", ["requested", "confirmed"]);
        }
        return response({
            error: "We couldn't create that appointment. Please review the details and try again.",
            success: "",
        });
    }
}
