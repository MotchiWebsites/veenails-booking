import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import { getDepositStatusLabel } from "@/features/bookings/utils/booking-status";

function preference(value: string | undefined) {
    if (value === "refund_etransfer") return "Legacy e-transfer refund";
    if (value === "account_credit") return "Convert deposit to credit";
    return "No refund needed";
}

export default function BookingCancellationSummary({ data }: { data: BookingDetailsData }) {
    const booking = data.summary;
    const request = data.cancellationRequest;
    if (booking.status !== "cancelled" && booking.status !== "cancellation_requested") return null;
    const cancelled = booking.status === "cancelled";
    const reason = data.cancellationReason ?? request?.reason ?? null;

    return (
        <div
            role="status"
            className="mb-6 rounded-3xl border border-pink-main/20 bg-pink-main/10 p-5 sm:p-6"
        >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">
                Cancellation update
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
                {cancelled
                    ? "This appointment was cancelled"
                    : "Your cancellation request is under review"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
                {cancelled
                    ? "This appointment is no longer scheduled."
                    : "The studio will review your request and confirm the outcome."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <p className="text-sm text-muted">
                    Status
                    <span className="mt-1 block font-semibold text-foreground">
                        {cancelled ? "Cancelled" : "Pending review"}
                    </span>
                </p>
                <p className="text-sm text-muted">
                    Preferred outcome
                    <span className="mt-1 block font-semibold text-foreground">
                        {preference(request?.requestedRefundMethod)}
                    </span>
                </p>
                <p className="text-sm text-muted">
                    Deposit
                    <span className="mt-1 block font-semibold text-foreground">
                        {getDepositStatusLabel(data.depositStatus)}
                    </span>
                </p>
            </div>
            {reason ? (
                <div className="mt-4 rounded-2xl bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Cancellation reason
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {reason}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
