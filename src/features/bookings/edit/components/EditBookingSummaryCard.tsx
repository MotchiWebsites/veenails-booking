import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import SummaryRow from "@/components/shared/ui/SummaryRow";
import BookingStatusBadge from "@/features/bookings/components/BookingStatusBadge";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import {
    formatBookingDateTime,
    formatBookingReference,
    formatShortLineItems,
} from "@/features/bookings/utils/booking-formatters";

export default function EditBookingSummaryCard({
    data,
}: {
    data: BookingDetailsData;
}) {
    const booking = data.summary;

    return (
        <StepSectionCard
            title="Current appointment"
            description="Review the booking you want to change."
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-green">
                        {formatBookingReference(booking.bookingReference)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">
                        {formatBookingDateTime(
                            booking.startsAt,
                            booking.endsAt,
                        )}
                    </h2>
                </div>
                <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-5">
                <SummaryRow
                    label="Services"
                    value={formatShortLineItems(booking.lineItems)}
                />
            </div>
        </StepSectionCard>
    );
}
