import Link from "next/link";
import { FiArrowLeft, FiEdit3 } from "react-icons/fi";

import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import SummaryRow from "@/components/shared/ui/SummaryRow";
import BookingStatusBadge from "@/features/bookings/components/BookingStatusBadge";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import {
    formatBookingDateTime,
    formatBookingReference,
    getBookingReferenceHref,
} from "@/features/bookings/utils/booking-formatters";
import {
    canEditBooking,
    getDepositStatusLabel,
} from "@/features/bookings/utils/booking-status";

export default function BookingOverviewCard({
    data,
}: {
    data: BookingDetailsData;
}) {
    const booking = data.summary;

    return (
        <StepSectionCard
            title="Booking overview"
            description="Review the current status and key appointment details."
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-green">
                        Booking reference
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-foreground">
                        {formatBookingReference(booking.bookingReference)}
                    </h1>
                </div>

                <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <SummaryRow
                    label="Appointment"
                    value={formatBookingDateTime(
                        booking.startsAt,
                        booking.endsAt,
                    )}
                />
                <SummaryRow
                    label="Deposit"
                    value={getDepositStatusLabel(data.depositStatus)}
                />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                    href="/booking"
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                    <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to My Bookings
                </Link>

                {canEditBooking(booking.status) ? (
                    <Link
                        href={getBookingReferenceHref(
                            booking.bookingReference,
                            "/edit",
                        )}
                        className="btn-primary inline-flex items-center justify-center gap-2"
                    >
                        <FiEdit3 className="h-4 w-4" aria-hidden="true" />
                        Edit appointment
                    </Link>
                ) : null}
            </div>
        </StepSectionCard>
    );
}
