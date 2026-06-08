import BookingActions from "@/features/bookings/components/BookingActions";
import BookingStatusBadge from "@/features/bookings/components/BookingStatusBadge";
import type { BookingSummary } from "@/features/bookings/types/bookings";
import {
    formatBookingDateTime,
    formatBookingReference,
    formatBookingPrice,
    formatShortLineItems,
} from "@/features/bookings/utils/booking-formatters";
import { getDepositStatusLabel } from "@/features/bookings/utils/booking-status";

export default function BookingCard({
    booking,
}: {
    booking: BookingSummary;
}) {
    const hasPrice = booking.estimatedTotal > 0 && booking.lineItems.length > 0;

    return (
        <article className="flex h-full flex-col rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
            <div className="flex flex-col gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-dark-green">
                            {formatBookingReference(booking.bookingReference)}
                        </p>
                        <BookingStatusBadge status={booking.status} />
                    </div>

                    <p className="mt-4 text-base font-semibold leading-snug text-foreground">
                        {formatBookingDateTime(booking.startsAt, booking.endsAt)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                        {formatShortLineItems(booking.lineItems)}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3">
                    <div>
                        <p className="text-xs font-semibold text-muted">
                            Estimated total
                        </p>
                        <p className="mt-1 text-lg font-semibold leading-tight text-foreground">
                            {hasPrice
                                ? formatBookingPrice(booking.estimatedTotal)
                                : "Price pending"}
                        </p>
                    </div>
                    <p className="text-right text-xs font-medium text-muted">
                        {getDepositStatusLabel(booking.depositStatus)}
                    </p>
                </div>
            </div>

            {booking.cancellationRequest ? (
                <p className="mt-4 rounded-2xl bg-background px-4 py-3 text-sm text-muted">
                    Cancellation request:{" "}
                    <span className="font-semibold capitalize text-foreground">
                        {booking.cancellationRequest.status.replace("_", " ")}
                    </span>
                </p>
            ) : null}

            <div className="mt-auto pt-4">
                <BookingActions booking={booking} allowCancellation={false} />
            </div>
        </article>
    );
}
