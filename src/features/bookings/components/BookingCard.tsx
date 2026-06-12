import BookingActions from "@/features/bookings/components/BookingActions";
import BookingStatusBadge from "@/features/bookings/components/BookingStatusBadge";
import type { BookingSummary } from "@/features/bookings/types/bookings";
import {
    formatBookingDate,
    formatBookingReference,
    formatBookingTimeRange,
    formatShortLineItems,
} from "@/features/bookings/utils/booking-formatters";

export default function BookingCard({ booking }: { booking: BookingSummary }) {
    const serviceSummary = formatShortLineItems(booking.lineItems);
    const hasCancellationRequest = Boolean(booking.cancellationRequest);

    return (
        <article className="flex h-full flex-col rounded-3xl border border-border/60 bg-surface p-5 shadow-sm transition hover:border-pink-200/70 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">
                        {formatBookingReference(booking.bookingReference)}
                    </p>

                    <div className="mt-3 space-y-1">
                        <h3 className="text-base font-semibold leading-snug text-foreground">
                            {formatBookingDate(booking.startsAt)}
                        </h3>
                        <p className="text-sm font-medium text-muted">
                            {formatBookingTimeRange(
                                booking.startsAt,
                                booking.endsAt,
                            )}
                        </p>
                    </div>
                </div>

                <BookingStatusBadge status={booking.status} />
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted">
                {serviceSummary}
            </p>

            {hasCancellationRequest ? (
                <div className="mt-4 rounded-2xl border border-border/60 bg-background px-4 py-3">
                    <p className="text-sm text-muted">
                        Cancellation request submitted.
                    </p>
                </div>
            ) : null}

            <div className="mt-auto pt-5">
                <BookingActions booking={booking} allowCancellation={false} />
            </div>
        </article>
    );
}
