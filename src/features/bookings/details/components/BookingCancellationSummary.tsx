import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import { getDepositStatusLabel } from "@/features/bookings/utils/booking-status";

function preference(value: string | undefined) {
    if (value === "refund_etransfer") return "Refund deposit";
    if (value === "account_credit") return "Convert deposit to credit";
    return "No refund needed";
}

export default function BookingCancellationSummary({ data }: { data: BookingDetailsData }) {
    const booking = data.summary;
    const request = data.cancellationRequest;
    if (booking.status !== "cancelled" && booking.status !== "cancellation_requested") return null;
    return <div className="mb-6 rounded-3xl border border-pink-main/20 bg-pink-main/10 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">Cancellation update</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">{booking.status === "cancelled" ? "This appointment was cancelled" : "Your cancellation request is under review"}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><p className="text-sm text-muted">Status<span className="mt-1 block font-semibold text-foreground">{booking.status === "cancelled" ? "Cancelled" : "Pending review"}</span></p><p className="text-sm text-muted">Preferred outcome<span className="mt-1 block font-semibold text-foreground">{preference(request?.requestedRefundMethod)}</span></p><p className="text-sm text-muted">Deposit<span className="mt-1 block font-semibold text-foreground">{getDepositStatusLabel(data.depositStatus)}</span></p></div>
        {request?.reason ? <p className="mt-4 rounded-2xl bg-surface p-4 text-sm leading-relaxed text-foreground">{request.reason}</p> : null}
    </div>;
}
