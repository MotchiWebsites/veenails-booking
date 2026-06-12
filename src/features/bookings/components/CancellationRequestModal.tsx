"use client";

import { useActionState, useEffect } from "react";
import AppSelect from "@/components/shared/form/AppSelect";
import ModalShell from "@/components/shared/ui/ModalShell";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { requestBookingCancellation } from "@/features/bookings/actions/bookings";
import {
    formatBookingDateTime,
    formatBookingReference,
} from "@/features/bookings/utils/booking-formatters";
import type {
    BookingCancellationActionState,
    BookingSummary,
} from "@/features/bookings/types/bookings";

const initialState: BookingCancellationActionState = {
    error: "",
    success: "",
    messageId: "",
};

export default function CancellationRequestModal({
    booking,
    onClose,
}: {
    booking: BookingSummary;
    onClose: () => void;
}) {
    const { error, success } = useToast();
    const [state, formAction, pending] = useActionState(
        requestBookingCancellation,
        initialState,
    );

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Cancellation request failed");
            return;
        }

        if (state.success) {
            success(state.success, "Request submitted");
            onClose();
        }
    }, [error, onClose, state.error, state.messageId, state.success, success]);

    return (
        <ModalShell
            title="Request cancellation"
            description={
                <>
                    {formatBookingReference(booking.bookingReference)} ·{" "}
                    {formatBookingDateTime(booking.startsAt, booking.endsAt)}
                </>
            }
            onClose={onClose}
        >
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />

                <label className="block">
                    <span className="text-sm font-semibold text-foreground">
                        Reason
                    </span>
                    <textarea
                        name="reason"
                        required
                        minLength={8}
                        rows={4}
                        className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-pink-main focus:ring-2 focus:ring-pink-main/20"
                        placeholder="Share anything helpful for the studio."
                    />
                </label>

                <AppSelect
                    label="Preferred refund handling"
                    name="requestedRefundMethod"
                    defaultValue="account_credit"
                    options={[
                        { value: "account_credit", label: "Account credit" },
                        {
                            value: "refund_etransfer",
                            label: "E-transfer refund",
                        },
                        { value: "no_refund", label: "No refund requested" },
                    ]}
                />

                <p className="rounded-2xl bg-pink-main/10 px-4 py-3 text-sm leading-relaxed text-muted">
                    Submitting this sends your request for review. The studio
                    may follow up before confirming any cancellation or refund.
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={pending}
                    >
                        Keep Booking
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={pending}
                    >
                        {pending ? "Submitting..." : "Submit Request"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
