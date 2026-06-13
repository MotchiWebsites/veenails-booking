import { FiCalendar } from "react-icons/fi";

import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import SummaryRow from "@/components/shared/ui/SummaryRow";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import {
    formatBookingDate,
    formatBookingTimeRange,
} from "@/features/bookings/utils/booking-formatters";

export default function BookingAppointmentDetailsCard({
    data,
}: {
    data: BookingDetailsData;
}) {
    const booking = data.summary;

    return (
        <StepSectionCard
            icon={<FiCalendar className="h-5 w-5" aria-hidden="true" />}
            title="Appointment details"
            description="The appointment time connected to this booking."
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <SummaryRow
                    label="Date"
                    value={formatBookingDate(booking.startsAt)}
                />
                <SummaryRow
                    label="Time"
                    value={formatBookingTimeRange(
                        booking.startsAt,
                        booking.endsAt,
                    )}
                />
            </div>

            {data.clientNotes ? (
                <div className="mt-5 rounded-3xl border border-border/60 bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                        Your notes
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {data.clientNotes}
                    </p>
                </div>
            ) : null}
        </StepSectionCard>
    );
}
