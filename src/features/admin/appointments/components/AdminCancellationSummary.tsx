import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { formatMoney } from "@/features/admin/components/admin-formatters";

function preference(value: string | undefined) {
    if (value === "refund_etransfer") return "Refund deposit";
    if (value === "account_credit") return "Convert deposit to credit";
    return "No refund needed";
}

export default function AdminCancellationSummary({ booking }: { booking: AdminAppointmentDetails }) {
    const request = booking.cancellationRequest;
    if (booking.status !== "cancelled" && booking.status !== "cancellation_requested" && !request) return null;
    const refunded = booking.payments.find((payment) => payment.paymentType === "deposit" && payment.status === "refunded");
    const credited = booking.payments.find((payment) => payment.paymentType === "deposit" && payment.status === "credited");
    const outcome = refunded ? `Deposit refunded (${formatMoney(refunded.amount)})` : credited || booking.linkedCredits.length ? `Converted to credit (${formatMoney(booking.linkedCredits[0]?.amount ?? credited?.amount ?? 0)})` : booking.depositStatus === "forfeited" ? "No refund / deposit forfeited" : booking.depositStatus === "received" ? "Decision pending" : "No received deposit";

    return <section className="rounded-3xl border border-pink-main/20 bg-pink-main/10 p-5 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">Cancellation</p>
        <div className="mt-3 grid gap-4 xl:grid-cols-3">
            <div><p className="text-sm text-muted">Current status</p><p className="mt-1 font-semibold text-foreground">{booking.status === "cancelled" ? "Cancelled" : "Cancellation requested"}</p></div>
            <div><p className="text-sm text-muted">User preference</p><p className="mt-1 font-semibold text-foreground">{preference(request?.requestedRefundMethod)}</p></div>
            <div><p className="text-sm text-muted">Refund / credit outcome</p><p className="mt-1 font-semibold text-foreground">{outcome}</p></div>
        </div>
        {request?.reason ? <div className="mt-4 rounded-2xl bg-surface p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Client reason</p><p className="mt-2 text-sm leading-relaxed text-foreground">{request.reason}</p></div> : null}
        {request?.adminDecision || request?.adminReason ? <p className="mt-3 text-sm text-muted">Admin decision: <span className="font-semibold text-foreground">{request.adminDecision ?? "Reviewed"}</span>{request.adminReason ? ` · ${request.adminReason}` : ""}</p> : null}
    </section>;
}
