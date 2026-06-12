"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/features/auth/guards/get-user";
import { canRequestCancellation } from "@/features/bookings/utils/booking-status";
import type {
    BookingCancellationActionState,
    RefundMethod,
} from "@/features/bookings/types/bookings";

const refundMethods = [
    "no_refund",
    "refund_etransfer",
    "account_credit",
] as const satisfies RefundMethod[];

function nextMessageId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function state(input: Omit<BookingCancellationActionState, "messageId">) {
    return {
        ...input,
        messageId: nextMessageId(),
    };
}

function getFormString(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export async function requestBookingCancellation(
    _prevState: BookingCancellationActionState,
    formData: FormData,
): Promise<BookingCancellationActionState> {
    const user = await getUser();

    if (!user) {
        return state({
            error: "Please sign in before requesting a cancellation.",
        });
    }

    const bookingId = getFormString(formData, "bookingId");
    const reason = getFormString(formData, "reason");
    const requestedRefundMethod = getFormString(
        formData,
        "requestedRefundMethod",
    ) as RefundMethod;

    if (!bookingId) {
        return state({
            error: "Choose a booking before requesting cancellation.",
        });
    }

    if (reason.length < 8) {
        return state({
            error: "Please include a short reason so the studio can review your request.",
        });
    }

    if (!refundMethods.includes(requestedRefundMethod)) {
        return state({
            error: "Choose how you would prefer any refund handled.",
        });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("id, user_id, status")
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (bookingError) {
        console.error("[bookings:requestCancellation.booking]", bookingError);
        return state({
            error: "We couldn't verify this booking. Please try again.",
        });
    }

    if (!booking) {
        return state({ error: "We couldn't find a booking you can cancel." });
    }

    if (!canRequestCancellation(booking.status)) {
        return state({
            error: "This booking is not eligible for a cancellation request.",
        });
    }

    const { data: duplicateRequest, error: duplicateError } = await supabase
        .from("cancellation_requests")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

    if (duplicateError) {
        console.error(
            "[bookings:requestCancellation.duplicate]",
            duplicateError,
        );
        return state({
            error: "We couldn't check existing cancellation requests. Please try again.",
        });
    }

    if (duplicateRequest) {
        return state({
            success: "Your cancellation request is already pending review.",
        });
    }

    const { error: insertError } = await admin
        .from("cancellation_requests")
        .insert({
            booking_id: booking.id,
            user_id: user.id,
            reason,
            requested_refund_method: requestedRefundMethod,
            status: "pending",
        });

    if (insertError) {
        console.error("[bookings:requestCancellation.insert]", insertError);
        return state({
            error: "We couldn't submit the cancellation request. Please try again.",
        });
    }

    const { error: updateError } = await admin
        .from("bookings")
        .update({ status: "cancellation_requested" })
        .eq("id", booking.id)
        .eq("user_id", user.id);

    if (updateError) {
        console.error(
            "[bookings:requestCancellation.status-sync]",
            updateError,
        );
        await admin
            .from("cancellation_requests")
            .delete()
            .eq("booking_id", booking.id)
            .eq("user_id", user.id)
            .eq("status", "pending");

        return state({
            error: "We couldn't update the booking status right now. Please try again.",
        });
    }

    const { error: eventError } = await admin.from("booking_events").insert({
        booking_id: booking.id,
        actor_type: "client",
        actor_user_id: user.id,
        event_type: "cancellation_requested",
        message: "Client requested cancellation.",
        metadata: {
            requestedRefundMethod,
        },
    });

    if (eventError) {
        console.error("[bookings:requestCancellation.event]", eventError);
    }

    revalidatePath("/booking");

    return state({
        success: "Cancellation requested. The studio will review it soon.",
    });
}
