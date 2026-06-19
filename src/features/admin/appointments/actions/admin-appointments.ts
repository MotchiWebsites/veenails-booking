"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums, Json } from "@/types/supabase";
import { removalOptions, services } from "@/features/bookings/new-booking/config";
import { appointmentStatusTemplate } from "@/features/notifications/email/templates/appointment-status-template";
import { cancellationTemplate } from "@/features/notifications/email/templates/cancellation-template";
import { sendTransactionalEmail } from "@/lib/email/brevo";

function getString(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
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
        .select("id, booking_reference, status, slot_id, user_id, deposit_status, availability_slots:slot_id(starts_at, ends_at), profiles:user_id(display_name, email)")
        .eq("id", bookingId)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            booking_reference: string;
            status: Enums<"booking_status">;
            slot_id: string | null;
            user_id: string;
            deposit_status: Enums<"deposit_status">;
            availability_slots: { starts_at: string; ends_at: string } | null;
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
    if (!booking.profiles?.email) return;
    const appointment = booking.availability_slots?.starts_at ? new Intl.DateTimeFormat("en-CA", { dateStyle: "full", timeStyle: "short" }).format(new Date(booking.availability_slots.starts_at)) : "Not scheduled";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const template = appointmentStatusTemplate({ name: booking.profiles.display_name, reference: booking.booking_reference, status, appointment, message, detailsUrl: siteUrl ? `${siteUrl}/booking/${booking.booking_reference}` : undefined });
    await sendTransactionalEmail({ to: { email: booking.profiles.email, name: booking.profiles.display_name }, ...template, notificationType, bookingId: booking.id, userId: booking.user_id });
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
        if (booking.profiles?.email) {
            const appointment = booking.availability_slots?.starts_at ? new Intl.DateTimeFormat("en-CA", { dateStyle: "full", timeStyle: "short" }).format(new Date(booking.availability_slots.starts_at)) : "Not scheduled";
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
            const template = cancellationTemplate({ name: booking.profiles.display_name, reference: booking.booking_reference, heading: status === "approved" ? "Cancellation approved" : "Cancellation request declined", appointment, reason: reason || "No additional note", outcome: status === "approved" ? "Appointment cancelled" : "Appointment remains confirmed", message: status === "approved" ? "The studio approved your cancellation request." : "The studio reviewed your request and your appointment remains confirmed.", detailsUrl: siteUrl ? `${siteUrl}/booking/${booking.booking_reference}` : undefined });
            await sendTransactionalEmail({ to: { email: booking.profiles.email, name: booking.profiles.display_name }, ...template, notificationType: `cancellation_${status}`, bookingId, userId: booking.user_id });
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

export async function updateAppointmentServicesAction(formData: FormData): Promise<void> {
    const { user } = await requireAdmin();
    const bookingId = getString(formData, "bookingId");
    const serviceId = getString(formData, "serviceId");
    const optionId = getString(formData, "serviceOptionId");
    const removalId = getString(formData, "removalId");
    const designTierId = getString(formData, "designTierId");
    if (!bookingId) throw new Error("Booking not found.");
    await getBooking(createAdminClient(), bookingId);

    const removal = removalOptions.find((option) => option.id === removalId);
    const service = services.find((item) => item.id === serviceId);
    const serviceOption = service?.options.find((option) => option.id === optionId);
    if (!removal || (removal.id !== "removal_only" && (!service || !serviceOption))) throw new Error("Choose valid appointment services.");

    const admin = createAdminClient();
    let designTier: { id: string; name: string; description: string; price: number } | null = null;
    if (designTierId && removal.id !== "removal_only") {
        const result = await admin.from("design_tiers").select("id, name, description, price").eq("id", designTierId).eq("active", true).maybeSingle().overrideTypes<typeof designTier>();
        if (result.error || !result.data) throw new Error("Choose a valid design tier.");
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
    const { data: oldItems, error: oldError } = await admin.from("booking_line_items").select("id, label_snapshot, item_type, line_total").eq("booking_id", bookingId).eq("active", true).overrideTypes<Array<{ id: string; label_snapshot: string; item_type: string; line_total: number | null }>>();
    if (oldError) throw oldError;
    const oldIds = (oldItems ?? []).map((item) => item.id);
    if (oldIds.length) {
        const { error } = await admin.from("booking_line_items").update({ active: false, removed_at: now, removed_by: user.id }).in("id", oldIds);
        if (error) throw error;
    }
    const { error: insertError } = await admin.from("booking_line_items").insert(nextItems);
    if (insertError) {
        if (oldIds.length) await admin.from("booking_line_items").update({ active: true, removed_at: null, removed_by: null }).in("id", oldIds);
        throw insertError;
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
}
