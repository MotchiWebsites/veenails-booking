import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { formatMoney } from "@/features/admin/components/admin-formatters";

function preference(value: string | undefined) {
    if (value === "refund_etransfer") return "Legacy e-transfer refund";
    if (value === "account_credit") return "Convert deposit to credit";
    return "No refund needed";
}

export default function AdminCancellationSummary({ booking }: { booking: AdminAppointmentDetails }) {
    const request = booking.cancellationRequest;
    if (booking.status !== "cancelled" && booking.status !== "cancellation_requested") return null;
    const refunded = booking.payments.find((payment) => payment.paymentType === "deposit" && payment.status === "refunded");
    const credited = booking.payments.find((payment) => payment.paymentType === "deposit" && payment.status === "credited");
    const outcome = refunded ? `Deposit refunded (${formatMoney(refunded.amount)})` : credited || booking.linkedCredits.length ? `Converted to credit (${formatMoney(booking.linkedCredits[0]?.amount ?? credited?.amount ?? 0)})` : booking.depositStatus === "forfeited" ? "No refund / deposit forfeited" : booking.depositStatus === "received" ? "Decision pending" : "No received deposit";
    const cancellationEvent = booking.events.find(
        (event) => event.eventType === "admin_booking_cancelled",
    );
    const eventMetadata =
        cancellationEvent?.metadata &&
        typeof cancellationEvent.metadata === "object" &&
        !Array.isArray(cancellationEvent.metadata)
            ? cancellationEvent.metadata
            : null;
    const eventReason =
        eventMetadata && typeof eventMetadata.reason === "string"
            ? eventMetadata.reason.trim()
            : "";
    const internalNote =
        eventMetadata && typeof eventMetadata.internalNote === "string"
            ? eventMetadata.internalNote.trim()
            : "";
    const reason = eventReason || request?.reason || "";
    const cancelled = booking.status === "cancelled";

    return <section role="status" className="rounded-3xl border border-pink-main/20 bg-pink-main/10 p-5 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">Cancellation</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">{cancelled ? "Appointment cancelled" : "Cancellation request pending"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{cancelled ? "This appointment is no longer scheduled." : "This appointment needs a cancellation decision."}</p>
        <div className="mt-3 grid gap-4 xl:grid-cols-3">
            <div><p className="text-sm text-muted">Current status</p><p className="mt-1 font-semibold text-foreground">{cancelled ? "Cancelled" : "Cancellation requested"}</p></div>
            <div><p className="text-sm text-muted">User preference</p><p className="mt-1 font-semibold text-foreground">{preference(request?.requestedRefundMethod)}</p></div>
            <div><p className="text-sm text-muted">Refund / credit outcome</p><p className="mt-1 font-semibold text-foreground">{outcome}</p></div>
        </div>
        {reason ? <div className="mt-4 rounded-2xl bg-surface p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Cancellation reason</p><p className="mt-2 text-sm leading-relaxed text-foreground">{reason}</p></div> : null}
        {internalNote ? <div className="mt-3 rounded-2xl border border-border/60 bg-background p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Internal note</p><p className="mt-2 text-sm leading-relaxed text-foreground">{internalNote}</p></div> : null}
        {request?.adminDecision || request?.adminReason ? <p className="mt-3 text-sm text-muted">Admin decision: <span className="font-semibold text-foreground">{request.adminDecision ?? "Reviewed"}</span>{request.adminReason ? ` · ${request.adminReason}` : ""}</p> : null}
    </section>;
}
