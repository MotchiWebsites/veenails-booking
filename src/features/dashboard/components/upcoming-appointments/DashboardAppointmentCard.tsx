import Link from "next/link";
import { FiArrowRight, FiXCircle } from "react-icons/fi";

import BookingStatusBadge from "@/features/bookings/components/BookingStatusBadge";
import type { BookingSummary } from "@/features/bookings/types/bookings";
import {
    formatBookingDate,
    formatBookingReference,
    formatBookingTimeRange,
    getBookingReferenceHref,
    formatShortLineItems,
} from "@/features/bookings/utils/booking-formatters";
import { canRequestCancellation } from "@/features/bookings/utils/booking-status";

export default function DashboardAppointmentCard({
    booking,
}: {
    booking: BookingSummary;
}) {
    const canCancel = canRequestCancellation(
        booking.status,
        booking.cancellationRequest,
    );

    return (
        <article className="flex h-full flex-col rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">
                        {formatBookingReference(booking.bookingReference)}
                    </p>
                    <h3 className="mt-3 text-base font-semibold text-foreground">
                        {formatBookingDate(booking.startsAt)}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-muted">
                        {formatBookingTimeRange(
                            booking.startsAt,
                            booking.endsAt,
                        )}
                    </p>
                </div>

                <BookingStatusBadge status={booking.status} />
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted">
                {formatShortLineItems(booking.lineItems)}
            </p>

            {booking.cancellationRequest ? (
                <p className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-muted">
                    Cancellation request submitted.
                </p>
            ) : null}

            <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
                <Link
                    href={getBookingReferenceHref(booking.bookingReference)}
                    className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
                >
                    View details
                    <FiArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                {canCancel ? (
                    <Link
                        href={getBookingReferenceHref(booking.bookingReference)}
                        className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
                    >
                        <FiXCircle className="h-4 w-4" aria-hidden="true" />
                        Request cancellation
                    </Link>
                ) : null}
            </div>
        </article>
    );
}
