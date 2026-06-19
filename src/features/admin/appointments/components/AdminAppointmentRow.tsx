import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { confirmAppointmentAction, markDepositReceivedAction } from "@/features/admin/appointments/actions/admin-appointments";
import type { AdminAppointmentListItem } from "@/features/admin/appointments/data/admin-appointments";
import AdminStatusPill from "@/features/admin/components/AdminStatusPill";
import { formatBookingDateTime, formatContactMethod, formatMoney } from "@/features/admin/components/admin-formatters";
import { getBookingStatusLabel, getDepositStatusLabel } from "@/features/bookings/utils/booking-status";

function QuickAction({ booking }: { booking: AdminAppointmentListItem }) {
    if (booking.status === "requested" || booking.status === "held") {
        return <form action={confirmAppointmentAction}><input type="hidden" name="bookingId" value={booking.id} /><button className="btn-primary w-full" type="submit">Confirm</button></form>;
    }
    if (booking.depositStatus === "marked_sent") {
        return <form action={markDepositReceivedAction}><input type="hidden" name="bookingId" value={booking.id} /><button className="btn-primary w-full" type="submit">Deposit received</button></form>;
    }
    if (booking.inspoStatus === "sent") {
        return <Link href={`/admin/appointments/${booking.id}#design-inspo`} className="btn-primary inline-flex items-center justify-center">Review</Link>;
    }
    return null;
}

export default function AdminAppointmentRow({ booking, quickAction = false }: { booking: AdminAppointmentListItem; quickAction?: boolean }) {
    const contact = booking.profile?.preferredContactMethod ? `${formatContactMethod(booking.profile.preferredContactMethod)} · ${booking.profile.phone ?? booking.profile.email}` : booking.profile?.email;
    const total = booking.finalTotal > 0 ? booking.finalTotal : booking.estimatedTotal;

    return (
        <article className="rounded-2xl border border-border/60 bg-background p-4 transition hover:border-dark-green/30 hover:shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)] xl:items-center">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-dark-green">#{booking.bookingReference}</span><AdminStatusPill label={getBookingStatusLabel(booking.status)} /><AdminStatusPill label={getDepositStatusLabel(booking.depositStatus)} /></div>
                    <p className="mt-2 font-medium text-foreground">{booking.profile?.displayName ?? "Unknown client"}</p>
                    <p className="mt-1 text-sm text-muted">{contact}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-foreground">{booking.serviceSummary}</p>
                </div>
                <div className="space-y-3 xl:text-right">
                    <div><p className="text-sm font-semibold text-foreground">{formatBookingDateTime(booking.startsAt, booking.endsAt)}</p><p className="mt-1 text-sm text-muted">{formatMoney(total)} to charge</p></div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:justify-end">
                        {quickAction ? <QuickAction booking={booking} /> : null}
                        <Link href={`/admin/appointments/${booking.id}`} className="btn-secondary inline-flex items-center justify-center gap-2">View details <FiArrowRight aria-hidden="true" /></Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
