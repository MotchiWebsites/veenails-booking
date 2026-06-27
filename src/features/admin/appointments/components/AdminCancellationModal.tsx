"use client";

import { useActionState, useEffect } from "react";
import AppSelect from "@/components/shared/form/AppSelect";
import ModalShell from "@/components/shared/ui/ModalShell";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    cancelAppointmentWithOutcomeAction,
    type AdminCancellationState,
} from "@/features/admin/appointments/actions/admin-cancellation";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { formatMoney } from "@/features/admin/components/admin-formatters";

const initial: AdminCancellationState = {
    error: "",
    success: "",
    messageId: "",
};

export default function AdminCancellationModal({
    booking,
    onClose,
}: {
    booking: AdminAppointmentDetails;
    onClose: () => void;
}) {
    const { error, success } = useToast();
    const [state, action, pending] = useActionState(
        cancelAppointmentWithOutcomeAction,
        initial,
    );
    const depositReceived = booking.depositStatus === "received";
    const preference = booking.cancellationRequest?.requestedRefundMethod;
    const canIssueCredit = Boolean(booking.profile?.id);
    const defaultOutcome =
        preference === "account_credit" && canIssueCredit
            ? "credit"
            : preference === "no_refund"
              ? "no_refund"
              : "";

    useEffect(() => {
        if (!state.messageId) return;
        if (state.error) error(state.error, "Cancellation failed");
        if (state.success) {
            success(state.success, "Appointment cancelled");
            onClose();
        }
    }, [error, onClose, state.error, state.messageId, state.success, success]);

    return (
        <ModalShell
            title="Cancel appointment"
            description={`#${booking.bookingReference} · ${booking.profile?.displayName ?? "Client"}`}
            onClose={onClose}
        >
            <form action={action} className="space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />
                <input
                    type="hidden"
                    name="requestId"
                    value={
                        booking.cancellationRequest?.status === "pending"
                            ? booking.cancellationRequest.id
                            : ""
                    }
                />
                <div className="grid gap-3 rounded-2xl bg-background p-4 sm:grid-cols-2">
                    <p className="text-sm text-muted">
                        Client
                        <span className="mt-1 block font-semibold text-foreground">
                            {booking.profile?.displayName ?? "Unknown"}
                        </span>
                        <span className="mt-1 block text-xs">
                            {booking.profile?.email}
                        </span>
                    </p>
                    <p className="text-sm text-muted">
                        Deposit
                        <span className="mt-1 block text-lg font-semibold text-foreground">
                            {formatMoney(booking.depositAmount)}
                        </span>
                        <span className="mt-1 block text-xs">
                            {depositReceived ? "Received" : "Not received"}
                        </span>
                    </p>
                </div>
                <label className="block space-y-2">
                    <span className="label-text">Cancellation reason</span>
                    <textarea
                        name="reason"
                        required
                        minLength={4}
                        className="input-field min-h-24 resize-y leading-relaxed"
                        placeholder="Explain why the appointment is being cancelled…"
                    />
                </label>
                {depositReceived ? (
                    <>
                        <p className="rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-muted">
                            {canIssueCredit
                                ? "Credit adds the deposit amount to the client's account. No refund records the deposit as forfeited."
                                : "External clients do not have account credits, so this cancellation can only record no refund."}
                        </p>
                        <AppSelect
                            label="Deposit outcome"
                            name="outcome"
                            defaultValue={defaultOutcome}
                            placeholder="Choose deposit outcome"
                            required
                            options={[
                                ...(canIssueCredit
                                    ? [
                                          {
                                              value: "credit",
                                              label: "Issue account credit",
                                          },
                                      ]
                                    : []),
                                { value: "no_refund", label: "No refund" },
                            ]}
                        />
                    </>
                ) : (
                    <>
                        <input type="hidden" name="outcome" value="no_refund" />
                        <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">
                            No received deposit was found, so this cancellation
                            will only close the appointment and reopen a future
                            slot.
                        </p>
                    </>
                )}
                <label className="block space-y-2">
                    <span className="label-text">Internal note (optional)</span>
                    <textarea
                        name="internalNote"
                        className="input-field min-h-24 resize-y leading-relaxed"
                        placeholder="Private context for appointment history…"
                    />
                </label>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={pending}
                    >
                        Keep appointment
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={pending}
                    >
                        {pending ? "Cancelling…" : "Confirm cancellation"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
