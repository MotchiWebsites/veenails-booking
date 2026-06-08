"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/features/auth/guards/get-user";
import type {
    BookingSelections,
    DesignTier,
    ServiceConfig,
    ServiceOption,
} from "@/features/bookings/new-booking/types";
import {
    buildServiceOptionLabel,
    calculateEstimate,
    getRemovalOption,
    getService,
    getServiceOption,
    isReviewReady,
} from "@/features/bookings/new-booking/utils";
import {
    isBookingCheckoutDraft,
    type BookingCheckoutDraft,
} from "@/lib/booking/checkout-draft";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingCheckoutActionState } from "@/features/bookings/checkout/types";
import type { Database } from "@/types/supabase";

type BookingSettingsRow = Pick<
    Database["public"]["Tables"]["booking_settings"]["Row"],
    | "deposit_amount"
    | "booking_fee_mode"
    | "booking_fee_rate"
    | "hold_minutes"
    | "etransfer_email"
>;

type DesignTierRow = Pick<
    Database["public"]["Tables"]["design_tiers"]["Row"],
    "id" | "name" | "description" | "price"
>;

type PolicyRow = Pick<
    Database["public"]["Tables"]["policies"]["Row"],
    "id" | "title" | "description"
>;

type BookingLineItemInsert =
    Database["public"]["Tables"]["booking_line_items"]["Insert"];

type BookingLineItemDraft = Omit<
    BookingLineItemInsert,
    "booking_id" | "id" | "created_at" | "updated_at"
>;

function nextMessageId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function state(
    input: Omit<BookingCheckoutActionState, "messageId">,
): BookingCheckoutActionState {
    return {
        ...input,
        messageId: nextMessageId(),
    };
}

function getFormString(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function parseDraft(rawValue: string): BookingCheckoutDraft | null {
    if (!rawValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawValue) as unknown;
        return isBookingCheckoutDraft(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function formatReferenceDate(date = new Date()) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${year}${month}${day}`;
}

async function generateBookingReference(
    admin: ReturnType<typeof createAdminClient>,
) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
        const bookingReference = `VNS-${formatReferenceDate()}-${suffix}`;

        const { data, error } = await admin
            .from("bookings")
            .select("id")
            .eq("booking_reference", bookingReference)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return bookingReference;
        }
    }

    throw new Error("Unable to generate a unique booking reference.");
}

function normalizeDesignTierLabel(label: string) {
    if (/^design tier/i.test(label)) {
        return label;
    }

    if (/^tier\s+/i.test(label)) {
        return `Design ${label}`;
    }

    return label;
}

function buildServiceLineItemLabel(
    service: ServiceConfig,
    serviceOption: ServiceOption,
) {
    if (service.id === "freestyle") {
        return service.label;
    }

    const optionLabel =
        serviceOption.groupLabel && service.id === "structured_gel_manicure"
            ? `${serviceOption.groupLabel} ${serviceOption.label}`
            : serviceOption.label;

    return `${service.label} — ${optionLabel}`;
}

function buildLineItems({
    draft,
    designTier,
}: {
    draft: BookingSelections;
    designTier: DesignTierRow | null;
}): BookingLineItemDraft[] {
    const removal = getRemovalOption(draft.removalId);
    const service = getService(draft.serviceId);
    const serviceOption = getServiceOption(service, draft.serviceOptionId);

    const lineItems: BookingLineItemDraft[] = [];

    if (removal && removal.price > 0) {
        lineItems.push({
            item_type: "removal",
            label_snapshot: removal.label,
            description_snapshot: removal.description,
            quantity: 1,
            unit_price: removal.price,
            active: true,
        });
    }

    if (draft.removalId !== "removal_only" && service && serviceOption) {
        lineItems.push({
            item_type: "service",
            label_snapshot: buildServiceLineItemLabel(service, serviceOption),
            description_snapshot:
                serviceOption.helperText ?? service.description,
            quantity: 1,
            unit_price: serviceOption.price,
            active: true,
        });
    }

    if (draft.removalId !== "removal_only" && designTier) {
        lineItems.push({
            item_type: "design_tier",
            source_table: "design_tiers",
            source_id: designTier.id,
            label_snapshot: normalizeDesignTierLabel(designTier.name),
            description_snapshot: designTier.description,
            quantity: 1,
            unit_price: Number(designTier.price ?? 0),
            active: true,
        });
    }

    return lineItems;
}

async function cleanupFailedBooking(
    admin: ReturnType<typeof createAdminClient>,
    bookingId: string | null,
    slotId: string,
) {
    if (bookingId) {
        await Promise.allSettled([
            admin
                .from("booking_policy_acceptances")
                .delete()
                .eq("booking_id", bookingId),
            admin.from("booking_events").delete().eq("booking_id", bookingId),
            admin.from("booking_payments").delete().eq("booking_id", bookingId),
            admin
                .from("booking_line_items")
                .delete()
                .eq("booking_id", bookingId),
        ]);

        await admin.from("bookings").delete().eq("id", bookingId);
    }

    await admin
        .from("availability_slots")
        .update({ status: "available" })
        .eq("id", slotId)
        .eq("status", "requested");
}

export async function submitBookingCheckout(
    _prevState: BookingCheckoutActionState,
    formData: FormData,
): Promise<BookingCheckoutActionState> {
    const user = await getUser();

    if (!user) {
        return state({
            error: "Please sign in before confirming your deposit.",
        });
    }

    const draft = parseDraft(getFormString(formData, "draft"));
    const depositConfirmed = getFormString(formData, "depositConfirmed");
    const policiesConfirmed = getFormString(formData, "policiesConfirmed");

    if (!draft) {
        return state({
            error: "Your booking selections were not found. Please start booking again.",
        });
    }

    if (depositConfirmed !== "true" || policiesConfirmed !== "true") {
        return state({
            error: "Please confirm both checkboxes before sending your booking request.",
        });
    }

    if (!isReviewReady(draft)) {
        return state({
            error: "Your booking selections are incomplete. Please start again.",
        });
    }

    const admin = createAdminClient();

    const [settingsResult, designTiersResult, policiesResult] =
        await Promise.all([
            admin
                .from("booking_settings")
                .select(
                    "deposit_amount, booking_fee_mode, booking_fee_rate, hold_minutes, etransfer_email",
                )
                .eq("id", 1)
                .eq("active", true)
                .maybeSingle()
                .overrideTypes<BookingSettingsRow | null>(),

            admin
                .from("design_tiers")
                .select("id, name, description, price")
                .eq("active", true)
                .overrideTypes<DesignTierRow[]>(),

            admin
                .from("policies")
                .select("id, title, description")
                .eq("active", true)
                .eq("policy_type", "booking")
                .overrideTypes<PolicyRow[]>(),
        ]);

    if (settingsResult.error) {
        console.error("[bookings:checkout.settings]", settingsResult.error);

        return state({
            error: "We couldn't load booking settings. Please try again.",
        });
    }

    if (designTiersResult.error) {
        console.error(
            "[bookings:checkout.design-tiers]",
            designTiersResult.error,
        );

        return state({
            error: "We couldn't validate your design tier. Please try again.",
        });
    }

    if (policiesResult.error) {
        console.error("[bookings:checkout.policies]", policiesResult.error);

        return state({
            error: "We couldn't verify the booking policies. Please try again.",
        });
    }

    const settings = settingsResult.data;

    if (!settings) {
        return state({
            error: "Checkout is unavailable because booking settings are missing.",
        });
    }

    const designTiers: DesignTier[] = (designTiersResult.data ?? []).map(
        (tier) => ({
            id: tier.id,
            label: tier.name,
            description: tier.description ?? undefined,
            price: Number(tier.price ?? 0),
            imageSrc: null,
            imageAlt: `${tier.name} design tier preview`,
        }),
    );

    const selectedDesignTier =
        draft.designTierId && draft.removalId !== "removal_only"
            ? ((designTiersResult.data ?? []).find(
                  (tier) => tier.id === draft.designTierId,
              ) ?? null)
            : null;

    if (draft.removalId !== "removal_only" && !selectedDesignTier) {
        return state({
            error: "Your selected design tier is no longer available. Please review your booking again.",
        });
    }

    const normalizedSettings = {
        depositAmount: Number(settings.deposit_amount ?? 0),
        bookingFeeMode: settings.booking_fee_mode,
        bookingFeeRate: Number(settings.booking_fee_rate ?? 0),
        holdMinutes: Number(settings.hold_minutes ?? 0),
    } as const;

    const removal = getRemovalOption(draft.removalId);
    const service = getService(draft.serviceId);
    const serviceOption = getServiceOption(service, draft.serviceOptionId);

    if (!removal) {
        return state({
            error: "Your removal selection is no longer valid. Please start again.",
        });
    }

    if (draft.removalId !== "removal_only" && (!service || !serviceOption)) {
        return state({
            error: "Your selected service is no longer valid. Please review your booking again.",
        });
    }

    const estimate = calculateEstimate(draft, normalizedSettings, designTiers);
    const bookingReference = await generateBookingReference(admin);
    const holdExpiresAt = new Date(
        Date.now() + normalizedSettings.holdMinutes * 60_000,
    ).toISOString();

    const lineItems = buildLineItems({
        draft,
        designTier: selectedDesignTier,
    });

    if (lineItems.length === 0) {
        return state({
            error: "Your booking does not include any valid services. Please review your selections.",
        });
    }

    let bookingId: string | null = null;

    const slotId = draft.slotId;

    if (!slotId) {
        return state({
            error: "Please select an appointment time before checking out.",
        });
    }

    try {
        const { data: lockedSlot, error: lockError } = await admin
            .from("availability_slots")
            .update({ status: "requested" })
            .eq("id", slotId)
            .eq("status", "available")
            .eq("active", true)
            .select("id, starts_at, ends_at")
            .maybeSingle();

        if (lockError) {
            throw lockError;
        }

        if (!lockedSlot) {
            return state({
                error: "This appointment time is no longer available.",
            });
        }

        const { data: booking, error: bookingError } = await admin
            .from("bookings")
            .insert({
                booking_reference: bookingReference,
                user_id: user.id,
                slot_id: draft.slotId,
                status: "requested",
                hold_expires_at: holdExpiresAt,
                deposit_amount: normalizedSettings.depositAmount,
                deposit_status: "marked_sent",
                booking_fee_rate: normalizedSettings.bookingFeeRate,
                booking_fee_mode: normalizedSettings.bookingFeeMode,
                final_total: 0,
                client_notes: null,
            })
            .select("id")
            .single();

        if (bookingError) {
            throw bookingError;
        }

        bookingId = booking.id;

        const lineItemsToInsert: BookingLineItemInsert[] = lineItems.map(
            (item) => ({
                ...item,
                booking_id: booking.id,
                added_by: user.id,
            }),
        );

        const { error: lineItemError } = await admin
            .from("booking_line_items")
            .insert(lineItemsToInsert);

        if (lineItemError) {
            throw lineItemError;
        }

        const { error: paymentError } = await admin
            .from("booking_payments")
            .insert({
                booking_id: booking.id,
                user_id: user.id,
                payment_type: "deposit",
                method: "etransfer",
                amount: normalizedSettings.depositAmount,
                status: "marked_sent",
                notes: "Client confirmed e-Transfer deposit was sent during checkout.",
            });

        if (paymentError) {
            throw paymentError;
        }

        if ((policiesResult.data ?? []).length > 0) {
            const { error: policyAcceptanceError } = await admin
                .from("booking_policy_acceptances")
                .insert(
                    (policiesResult.data ?? []).map((policy) => ({
                        booking_id: booking.id,
                        policy_id: policy.id,
                        title_snapshot: policy.title,
                        description_snapshot: policy.description,
                    })),
                );

            if (policyAcceptanceError) {
                throw policyAcceptanceError;
            }
        }

        const { error: eventError } = await admin
            .from("booking_events")
            .insert({
                booking_id: booking.id,
                actor_type: "client",
                actor_user_id: user.id,
                event_type: "booking_requested",
                message:
                    "Client submitted booking request and marked deposit as sent.",
                metadata: {
                    slotId: draft.slotId,
                    startsAt: lockedSlot.starts_at,
                    endsAt: lockedSlot.ends_at,
                    removal: removal.label,
                    service: service?.label ?? null,
                    serviceOption:
                        buildServiceOptionLabel(service, serviceOption) ?? null,
                    designTier: selectedDesignTier?.name ?? null,
                    depositAmount: normalizedSettings.depositAmount,
                    estimatedSubtotal: estimate.subtotal,
                    estimatedBookingFee: estimate.bookingFee,
                    estimatedTotal: estimate.total,
                },
            });

        if (eventError) {
            throw eventError;
        }

        revalidatePath("/booking");
        revalidatePath("/book");
        revalidatePath("/dashboard");

        return state({
            success:
                "Your booking request has been received and your deposit is marked as sent.",
            bookingReference,
            startsAt: lockedSlot.starts_at,
            endsAt: lockedSlot.ends_at,
            depositAmount: normalizedSettings.depositAmount,
        });
    } catch (error) {
        console.error("[bookings:checkout.submit]", error);

        await cleanupFailedBooking(admin, bookingId, slotId);

        return state({
            error: "We couldn't send your booking request right now. Please try again.",
        });
    }
}
