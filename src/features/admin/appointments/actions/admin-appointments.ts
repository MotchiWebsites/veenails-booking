"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Enums, Json } from "@/types/supabase";
import { removalOptions, services } from "@/features/bookings/new-booking/config";
import { appointmentStatusTemplate } from "@/features/notifications/email/templates/appointment-status-template";
import { cancellationTemplate } from "@/features/notifications/email/templates/cancellation-template";
import { sendTransactionalEmail } from "@/lib/email/brevo";

export type AdminAppointmentEditState = {
    error?: string;
    success?: string;
    messageId?: string;
};

function editState(input: Omit<AdminAppointmentEditState, "messageId">) {
    return {
        ...input,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

function getString(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
}

function getNumber(formData: FormData, key: string) {
    const value = getString(formData, key);
    if (!value) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function parseStoredDiscountPercentage(label: string, fallbackAmount: number, subtotal: number) {
    const match = label.match(/\(([\d.]+)%\)/);
    if (match) {
        const parsed = Number(match[1]);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) return roundCurrency(parsed);
    }

    if (subtotal > 0 && fallbackAmount > 0) {
        return Math.min(100, roundCurrency((fallbackAmount / subtotal) * 100));
    }

    return null;
}

function revalidateAdminBooking(bookingId: string) {
    revalidatePath("/admin");
    revalidatePath("/admin/appointments");
    revalidatePath(`/admin/appointments/${bookingId}`);
    revalidatePath("/booking");
    revalidatePath("/dashboard");
}

async function getBooking(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
    const { data, error } = await admin
        .from("bookings")
        .select("id, booking_reference, status, slot_id, user_id, deposit_status, client_display_name, client_email, availability_slots:slot_id(starts_at, ends_at), profiles:user_id(display_name, email)")
        .eq("id", bookingId)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            booking_reference: string;
            status: Enums<"booking_status">;
            slot_id: string | null;
            user_id: string | null;
            client_display_name: string | null;
            client_email: string | null;
            deposit_status: Enums<"deposit_status">;
            availability_slots: { starts_at: string; ends_at: string | null } | null;
            profiles: { display_name: string; email: string } | null;
        } | null>();

    if (error) {
        console.error("[admin:booking-action:get-booking]", error);
        throw new Error("We couldn't load this booking.");
    }

    if (!data) {
        throw new Error("Booking not found.");
    }

    return data;
}

async function emailBookingStatus(booking: Awaited<ReturnType<typeof getBooking>>, status: string, message: string, notificationType: string) {
    const recipientEmail = booking.profiles?.email ?? booking.client_email;
    const recipientName = booking.profiles?.display_name ?? booking.client_display_name ?? "Client";
    if (!recipientEmail) return;
    const appointment = booking.availability_slots?.starts_at ? new Intl.DateTimeFormat("en-CA", { dateStyle: "full", timeStyle: "short" }).format(new Date(booking.availability_slots.starts_at)) : "Not scheduled";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const template = appointmentStatusTemplate({ name: recipientName, reference: booking.booking_reference, status, appointment, message, detailsUrl: booking.user_id && siteUrl ? `${siteUrl}/booking/${booking.booking_reference}` : undefined });
    await sendTransactionalEmail({ to: { email: recipientEmail, name: recipientName }, ...template, notificationType, bookingId: booking.id, userId: booking.user_id ?? undefined });
}

async function insertEvent({
    admin,
    bookingId,
    adminUserId,
    eventType,
    message,
    metadata = {},
}: {
    admin: ReturnType<typeof createAdminClient>;
    bookingId: string;
    adminUserId: string;
    eventType: string;
    message: string;
    metadata?: Json;
}) {
    const { error } = await admin.from("booking_events").insert({
        booking_id: bookingId,
        actor_type: "admin",
        actor_user_id: adminUserId,
        event_type: eventType,
        message,
        metadata,
    });

    if (error) {
        console.error("[admin:booking-action:event]", error);
        throw new Error("The appointment changed, but its history could not be recorded.");
    }
}

export async function confirmAppointmentAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const admin = createAdminClient();

    try {
        const booking = await getBooking(admin, bookingId);

        if (booking.status !== "requested" && booking.status !== "held") {
            return;
        }

        const { error } = await admin
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId);

        if (error) throw error;

        if (booking.slot_id) {
            await admin
                .from("availability_slots")
                .update({ status: "confirmed" })
                .eq("id", booking.slot_id);
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_booking_confirmed",
            message: "Admin confirmed the appointment.",
            metadata: { previousStatus: booking.status, newStatus: "confirmed" },
        });
        await emailBookingStatus(booking, "confirmed", "The studio confirmed your appointment.", "appointment_confirmed");

        revalidateAdminBooking(bookingId);
    } catch (error) {
        console.error("[admin:confirm-appointment]", error);
    }
}

export async function rejectAppointmentAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const reason = getString(formData, "reason");
    const admin = createAdminClient();

    if (!reason) return;

    try {
        const booking = await getBooking(admin, bookingId);

        if (booking.status !== "requested" && booking.status !== "held") {
            return;
        }

        const { error } = await admin
            .from("bookings")
            .update({ status: "rejected" })
            .eq("id", bookingId);

        if (error) throw error;

        if (booking.slot_id) {
            await admin
                .from("availability_slots")
                .update({ status: "available" })
                .eq("id", booking.slot_id);
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_booking_rejected",
            message: "Admin rejected the appointment.",
            metadata: {
                reason,
                previousStatus: booking.status,
                newStatus: "rejected",
            },
        });
        await emailBookingStatus(booking, "rejected", `The studio could not accept this request. Reason: ${reason}`, "appointment_rejected");

        revalidateAdminBooking(bookingId);
    } catch (error) {
        console.error("[admin:reject-appointment]", error);
    }
}

export async function markDepositReceivedAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const admin = createAdminClient();

    try {
        const booking = await getBooking(admin, bookingId);
        if (
            !["held", "requested", "confirmed", "cancellation_requested"].includes(booking.status) ||
            !["pending", "marked_sent"].includes(booking.deposit_status)
        ) return;
        const now = new Date().toISOString();

        const { error: bookingError } = await admin
            .from("bookings")
            .update({ deposit_status: "received" })
            .eq("id", bookingId);

        if (bookingError) throw bookingError;

        const { error: paymentError } = await admin
            .from("booking_payments")
            .update({
                status: "received",
                paid_at: now,
                marked_by: user.id,
            })
            .eq("booking_id", bookingId)
            .eq("payment_type", "deposit")
            .in("status", ["pending", "marked_sent"]);

        if (paymentError) throw paymentError;

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_deposit_received",
            message: "Admin marked deposit as received.",
            metadata: {
                previousDepositStatus: booking.deposit_status,
                newDepositStatus: "received",
                receivedAt: now,
            },
        });
        await emailBookingStatus(booking, "deposit received", "Your deposit was marked as received.", "deposit_confirmed");

        revalidateAdminBooking(bookingId);
    } catch (error) {
        console.error("[admin:deposit-received]", error);
    }
}

export async function updateAppointmentStatusAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const nextStatus = getString(formData, "status") as Enums<"booking_status">;
    const note = getString(formData, "note");
    const admin = createAdminClient();

    if (!["completed", "no_show"].includes(nextStatus)) {
        return;
    }

    try {
        const booking = await getBooking(admin, bookingId);
        if (booking.status !== "confirmed") return;
        if (
            booking.availability_slots?.starts_at &&
            new Date(booking.availability_slots.starts_at) > new Date()
        ) return;
        if (nextStatus === "no_show" && !note) return;
        const now = new Date().toISOString();
        const update =
            nextStatus === "completed"
                ? { status: nextStatus, completed_at: now }
                : { status: nextStatus };

        const { error } = await admin
            .from("bookings")
            .update(update)
            .eq("id", bookingId);

        if (error) throw error;

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: `admin_booking_${nextStatus}`,
            message:
                nextStatus === "completed"
                    ? "Admin marked appointment completed."
                    : "Admin marked appointment as no-show.",
            metadata: {
                previousStatus: booking.status,
                newStatus: nextStatus,
                note: note || null,
            },
        });
        await emailBookingStatus(booking, nextStatus === "no_show" ? "marked no-show" : "completed", nextStatus === "no_show" ? `The appointment was marked as a no-show. ${note}` : "Your appointment was marked completed.", `appointment_${nextStatus}`);

        revalidateAdminBooking(bookingId);
    } catch (error) {
        console.error("[admin:update-status]", error);
    }
}

export async function reviewCancellationAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const requestId = getString(formData, "requestId");
    const decision = getString(formData, "decision");
    const reason = getString(formData, "reason");
    const admin = createAdminClient();

    if (!requestId || decision !== "rejected") {
        return;
    }

    try {
        const booking = await getBooking(admin, bookingId);
        if (booking.status !== "cancellation_requested") return;
        const status = decision as "approved" | "rejected";
        if (status === "rejected" && !reason) return;
        const now = new Date().toISOString();

        const { data, error } = await admin
            .from("cancellation_requests")
            .update({
                status,
                reviewed_at: now,
                reviewed_by: user.id,
                admin_reason: reason || null,
                admin_decision: status,
            })
            .eq("id", requestId)
            .eq("booking_id", bookingId)
            .eq("status", "pending")
            .select("id")
            .maybeSingle();

        if (error || !data) throw error ?? new Error("Cancellation request is no longer pending.");

        if (status === "approved") {
            await admin
                .from("bookings")
                .update({ status: "cancelled", cancelled_at: now })
                .eq("id", bookingId);

            if (
                booking.slot_id &&
                booking.availability_slots?.starts_at &&
                new Date(booking.availability_slots.starts_at) > new Date()
            ) {
                await admin
                    .from("availability_slots")
                    .update({ status: "available", active: true })
                    .eq("id", booking.slot_id);
            }
        } else {
            await admin
                .from("bookings")
                .update({ status: "confirmed" })
                .eq("id", bookingId)
                .eq("status", "cancellation_requested");

            if (booking.slot_id) {
                await admin
                    .from("availability_slots")
                    .update({ status: "confirmed" })
                    .eq("id", booking.slot_id);
            }
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: `admin_cancellation_${status}`,
            message: `Admin ${status} the cancellation request.`,
            metadata: {
                reason: reason || null,
                requestId,
                previousStatus: booking.status,
                newStatus: status === "approved" ? "cancelled" : "confirmed",
            },
        });
        const recipientEmail = booking.profiles?.email ?? booking.client_email;
        const recipientName = booking.profiles?.display_name ?? booking.client_display_name ?? "Client";
        if (recipientEmail) {
            const appointment = booking.availability_slots?.starts_at ? new Intl.DateTimeFormat("en-CA", { dateStyle: "full", timeStyle: "short" }).format(new Date(booking.availability_slots.starts_at)) : "Not scheduled";
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
            const template = cancellationTemplate({ name: recipientName, reference: booking.booking_reference, heading: status === "approved" ? "Cancellation approved" : "Cancellation request declined", appointment, reason: reason || "No additional note", outcome: status === "approved" ? "Appointment cancelled" : "Appointment remains confirmed", message: status === "approved" ? "The studio approved your cancellation request." : "The studio reviewed your request and your appointment remains confirmed.", detailsUrl: booking.user_id && siteUrl ? `${siteUrl}/booking/${booking.booking_reference}` : undefined });
            await sendTransactionalEmail({ to: { email: recipientEmail, name: recipientName }, ...template, notificationType: `cancellation_${status}`, bookingId, userId: booking.user_id ?? undefined });
        }

        revalidateAdminBooking(bookingId);
    } catch (error) {
        console.error("[admin:review-cancellation]", error);
    }
}

export async function markInspoReviewedAction(
    formData: FormData,
): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const promptId = getString(formData, "promptId");
    const admin = createAdminClient();

    if (!promptId) return;

    try {
        const { data, error } = await admin
            .from("booking_inspo_prompts")
            .update({
                status: "reviewed",
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id,
            })
            .eq("id", promptId)
            .eq("booking_id", bookingId)
            .eq("status", "sent")
            .select("id")
            .maybeSingle();

        if (error || !data) throw error ?? new Error("Design inspo is not ready for review.");

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_design_inspo_reviewed",
            message: "Admin marked design inspo reviewed.",
            metadata: {
                promptId,
                previousStatus: "sent",
                newStatus: "reviewed",
            },
        });

        revalidateAdminBooking(bookingId);
    } catch (error) {
        console.error("[admin:inspo-reviewed]", error);
    }
}

export async function updateAppointmentSlotAction(formData: FormData): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const newSlotId = getString(formData, "slotId");
    if (!bookingId || !newSlotId) throw new Error("Choose a new appointment time.");

    const admin = createAdminClient();
    const booking = await getBooking(admin, bookingId);
    if (booking.slot_id === newSlotId) return;

    const { data: slot, error: slotError } = await admin.from("availability_slots").select("id, starts_at, ends_at, status").eq("id", newSlotId).eq("active", true).eq("status", "available").gte("starts_at", new Date().toISOString()).maybeSingle().overrideTypes<{ id: string; starts_at: string; ends_at: string; status: Enums<"slot_status"> } | null>();
    if (slotError || !slot) throw new Error("That appointment time is no longer available.");

    const reservedStatus: Enums<"slot_status"> = booking.status === "confirmed" ? "confirmed" : "held";
    const { data: reserved, error: reserveError } = await admin.from("availability_slots").update({ status: reservedStatus }).eq("id", newSlotId).eq("status", "available").select("id").maybeSingle();
    if (reserveError || !reserved) throw new Error("That appointment time was just taken.");

    const { error: bookingError } = await admin.from("bookings").update({ slot_id: newSlotId }).eq("id", bookingId);
    if (bookingError) {
        await admin.from("availability_slots").update({ status: "available" }).eq("id", newSlotId);
        throw bookingError;
    }
    if (booking.slot_id) await admin.from("availability_slots").update({ status: "available" }).eq("id", booking.slot_id);

    await insertEvent({ admin, bookingId, adminUserId: user.id, eventType: "admin_appointment_rescheduled", message: "Admin changed the appointment time.", metadata: { previousSlotId: booking.slot_id, previousStartsAt: booking.availability_slots?.starts_at ?? null, previousEndsAt: booking.availability_slots?.ends_at ?? null, newSlotId, startsAt: slot.starts_at, endsAt: slot.ends_at } });
    revalidateAdminBooking(bookingId);
}

export async function updateAppointmentServicesAction(
    _previousState: AdminAppointmentEditState,
    formData: FormData,
): Promise<AdminAppointmentEditState> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const serviceId = getString(formData, "serviceId");
    const optionId = getString(formData, "serviceOptionId");
    const removalId = getString(formData, "removalId");
    const designTierId = getString(formData, "designTierId");
    if (!bookingId) return editState({ error: "Booking not found." });

    const admin = createAdminClient();

    try {
        await getBooking(admin, bookingId);

        const removal = removalOptions.find((option) => option.id === removalId);
        const service = services.find((item) => item.id === serviceId);
        const serviceOption = service?.options.find((option) => option.id === optionId);
        if (!removal || (removal.id !== "removal_only" && (!service || !serviceOption))) return editState({ error: "Choose valid appointment services." });

        let designTier: { id: string; name: string; description: string | null; price: number } | null = null;
        if (designTierId && removal.id !== "removal_only") {
            const result = await admin.from("design_tiers").select("id, name, description, price").eq("id", designTierId).eq("active", true).maybeSingle().overrideTypes<typeof designTier>();
            if (result.error || !result.data) return editState({ error: "Choose a valid design tier." });
            designTier = { ...result.data, price: Number(result.data.price) };
        }

        const nextItems: Array<{ booking_id: string; item_type: Enums<"booking_line_item_type">; label_snapshot: string; description_snapshot?: string | null; quantity: number; unit_price: number; source_table?: string; source_id?: string; added_by: string }> = [];
        if (removal.price > 0) nextItems.push({ booking_id: bookingId, item_type: "removal", label_snapshot: removal.label, description_snapshot: removal.description, quantity: 1, unit_price: removal.price, added_by: user.id });
        if (removal.id !== "removal_only" && service && serviceOption) {
            const optionLabel = "groupLabel" in serviceOption && serviceOption.groupLabel ? `${serviceOption.groupLabel} ${serviceOption.label}` : serviceOption.label;
            nextItems.push({ booking_id: bookingId, item_type: "service", label_snapshot: service.id === "freestyle" ? service.label : `${service.label} • ${optionLabel}`, description_snapshot: ("helperText" in serviceOption ? serviceOption.helperText : null) ?? service.description, quantity: 1, unit_price: serviceOption.price, source_table: "booking_config", source_id: `${service.id}:${serviceOption.id}`, added_by: user.id });
        }
        if (designTier) nextItems.push({ booking_id: bookingId, item_type: "design_tier", label_snapshot: designTier.name, description_snapshot: designTier.description, quantity: 1, unit_price: designTier.price, source_table: "design_tiers", source_id: designTier.id, added_by: user.id });

        const now = new Date().toISOString();
        const editableTypes: Enums<"booking_line_item_type">[] = ["service", "design_tier", "removal"];
        const { data: oldItems, error: oldError } = await admin.from("booking_line_items").select("id, label_snapshot, item_type, line_total").eq("booking_id", bookingId).eq("active", true).in("item_type", editableTypes).overrideTypes<Array<{ id: string; label_snapshot: string; item_type: string; line_total: number | null }>>();
        if (oldError) throw oldError;
        const { data: activeDiscount, error: discountError } = await admin
            .from("booking_line_items")
            .select("id, label_snapshot, description_snapshot, unit_price, line_total")
            .eq("booking_id", bookingId)
            .eq("item_type", "discount")
            .eq("active", true)
            .is("removed_at", null)
            .maybeSingle()
            .overrideTypes<{ id: string; label_snapshot: string; description_snapshot: string | null; unit_price: number; line_total: number | null } | null>();
        if (discountError) throw discountError;
        const oldIds = (oldItems ?? []).map((item) => item.id);
        const previousServiceSubtotal = roundCurrency((oldItems ?? []).reduce((sum, item) => sum + Number(item.line_total ?? 0), 0));
        const activeDiscountPercentage = activeDiscount
            ? parseStoredDiscountPercentage(activeDiscount.label_snapshot, Math.abs(Number(activeDiscount.line_total ?? activeDiscount.unit_price ?? 0)), previousServiceSubtotal)
            : null;
        if (oldIds.length) {
            const { error } = await admin.from("booking_line_items").update({ active: false, removed_at: now, removed_by: user.id }).in("id", oldIds);
            if (error) throw error;
        }
        const { error: insertError } = await admin.from("booking_line_items").insert(nextItems);
        if (insertError) {
            if (oldIds.length) await admin.from("booking_line_items").update({ active: true, removed_at: null, removed_by: null }).in("id", oldIds);
            throw insertError;
        }

        if (activeDiscount && activeDiscountPercentage !== null) {
            const newServiceSubtotal = roundCurrency(nextItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0));
            const nextDiscountAmount = Math.min(newServiceSubtotal, roundCurrency((newServiceSubtotal * activeDiscountPercentage) / 100));
            const previousDiscountAmount = Math.abs(Number(activeDiscount.line_total ?? activeDiscount.unit_price ?? 0));
            const label = `Admin discount (${activeDiscountPercentage}%)`;
            const { error: discountUpdateError } = await admin
                .from("booking_line_items")
                .update({
                    label_snapshot: label,
                    quantity: 1,
                    unit_price: -nextDiscountAmount,
                })
                .eq("id", activeDiscount.id)
                .eq("booking_id", bookingId)
                .eq("item_type", "discount")
                .eq("active", true);

            if (discountUpdateError) throw discountUpdateError;

            if (previousDiscountAmount !== nextDiscountAmount) {
                await insertEvent({
                    admin,
                    bookingId,
                    adminUserId: user.id,
                    eventType: "admin_discount_updated",
                    message: `Admin discount recalculated to ${activeDiscountPercentage}% after service changes.`,
                    metadata: {
                        discountLineItemId: activeDiscount.id,
                        percentage: activeDiscountPercentage,
                        previousAmount: previousDiscountAmount,
                        amount: nextDiscountAmount,
                        reason: "service_pricing_changed",
                    },
                });
            }
        }

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_services_updated",
            message: "Admin updated appointment services and pricing.",
            metadata: {
                previousItems: (oldItems ?? []).map((item) => ({ id: item.id, type: item.item_type, label: item.label_snapshot, total: Number(item.line_total ?? 0) })),
                newItems: nextItems.map((item) => ({ type: item.item_type, label: item.label_snapshot, total: item.unit_price * item.quantity })),
                previousSubtotal: (oldItems ?? []).reduce((sum, item) => sum + Number(item.line_total ?? 0), 0),
                newSubtotal: nextItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
            },
        });
        revalidateAdminBooking(bookingId);
        return editState({ success: "Service changes saved." });
    } catch (error) {
        console.error("[admin:update-services]", error);
        return editState({ error: "We couldn't save those service changes. Please review the selections and try again." });
    }
}

export async function updateAppointmentDiscountAction(
    _previousState: AdminAppointmentEditState,
    formData: FormData,
): Promise<AdminAppointmentEditState> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const percentage = getNumber(formData, "discountPercentage");
    const note = getString(formData, "discountNote");

    if (!bookingId) return editState({ error: "Booking not found." });
    if (percentage === null || percentage < 0 || percentage > 100) {
        return editState({ error: "Enter a discount percentage from 0 to 100." });
    }

    const admin = createAdminClient();

    try {
        const booking = await getBooking(admin, bookingId);
        if (["completed", "no_show", "cancelled", "rejected", "expired"].includes(booking.status)) {
            return editState({ error: "This appointment is closed. Use the correction flow for pricing changes." });
        }

        const { data: lineItems, error: lineItemsError } = await admin
            .from("booking_line_items")
            .select("id, item_type, label_snapshot, description_snapshot, quantity, unit_price, line_total")
            .eq("booking_id", bookingId)
            .eq("active", true)
            .is("removed_at", null)
            .overrideTypes<
                Array<{
                    id: string;
                    item_type: Enums<"booking_line_item_type">;
                    label_snapshot: string;
                    description_snapshot: string | null;
                    quantity: number;
                    unit_price: number;
                    line_total: number | null;
                }>
            >();

        if (lineItemsError) throw lineItemsError;

        const activeItems = lineItems ?? [];
        const existingDiscount = activeItems.find((item) => item.item_type === "discount") ?? null;
        const eligibleSubtotal = roundCurrency(
            activeItems
                .filter((item) => item.item_type !== "discount")
                .reduce((sum, item) => sum + Number(item.line_total ?? Number(item.unit_price ?? 0) * Number(item.quantity ?? 1)), 0),
        );
        const normalizedPercentage = roundCurrency(percentage);
        const discountAmount = Math.min(eligibleSubtotal, roundCurrency((eligibleSubtotal * normalizedPercentage) / 100));
        const now = new Date().toISOString();

        if (normalizedPercentage > 0 && eligibleSubtotal <= 0) {
            return editState({ error: "Add services before applying a discount." });
        }

        if (normalizedPercentage === 0) {
            if (!existingDiscount) {
                return editState({ success: "No discount is applied." });
            }

            const { error } = await admin
                .from("booking_line_items")
                .update({ active: false, removed_at: now, removed_by: user.id })
                .eq("id", existingDiscount.id)
                .eq("booking_id", bookingId)
                .eq("item_type", "discount");

            if (error) throw error;

            await insertEvent({
                admin,
                bookingId,
                adminUserId: user.id,
                eventType: "admin_discount_removed",
                message: "Admin removed an appointment discount.",
                metadata: {
                    discountLineItemId: existingDiscount.id,
                    previousLabel: existingDiscount.label_snapshot,
                    previousAmount: Math.abs(Number(existingDiscount.line_total ?? existingDiscount.unit_price ?? 0)),
                    note: note || null,
                },
            });

            revalidateAdminBooking(bookingId);
            return editState({ success: "Discount removed." });
        }

        const label = `Admin discount (${normalizedPercentage}%)`;
        const discountPayload: Database["public"]["Tables"]["booking_line_items"]["Update"] = {
            label_snapshot: label,
            description_snapshot: note || null,
            quantity: 1,
            unit_price: -discountAmount,
        };

        if (existingDiscount) {
            const { error } = await admin
                .from("booking_line_items")
                .update(discountPayload)
                .eq("id", existingDiscount.id)
                .eq("booking_id", bookingId)
                .eq("item_type", "discount")
                .eq("active", true);

            if (error) throw error;

            await insertEvent({
                admin,
                bookingId,
                adminUserId: user.id,
                eventType: "admin_discount_updated",
                message: `Admin updated an appointment discount to ${normalizedPercentage}%.`,
                metadata: {
                    discountLineItemId: existingDiscount.id,
                    percentage: normalizedPercentage,
                    amount: discountAmount,
                    previousLabel: existingDiscount.label_snapshot,
                    previousAmount: Math.abs(Number(existingDiscount.line_total ?? existingDiscount.unit_price ?? 0)),
                    note: note || null,
                },
            });

            revalidateAdminBooking(bookingId);
            return editState({ success: "Discount updated." });
        }

        const insertPayload: Database["public"]["Tables"]["booking_line_items"]["Insert"] = {
            booking_id: bookingId,
            item_type: "discount",
            label_snapshot: label,
            description_snapshot: note || null,
            quantity: 1,
            unit_price: -discountAmount,
            active: true,
            added_by: user.id,
        };
        const { data: insertedDiscount, error: insertError } = await admin
            .from("booking_line_items")
            .insert(insertPayload)
            .select("id")
            .single();

        if (insertError) throw insertError;

        await insertEvent({
            admin,
            bookingId,
            adminUserId: user.id,
            eventType: "admin_discount_added",
            message: `Admin added a ${normalizedPercentage}% appointment discount.`,
            metadata: {
                discountLineItemId: insertedDiscount.id,
                percentage: normalizedPercentage,
                amount: discountAmount,
                note: note || null,
            },
        });

        revalidateAdminBooking(bookingId);
        return editState({ success: "Discount saved." });
    } catch (error) {
        console.error("[admin:update-discount]", error);
        return editState({ error: "We couldn't save that discount. Please review it and try again." });
    }
}
