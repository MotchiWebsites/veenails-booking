import BookingCancellationCard from "@/features/bookings/details/components/BookingCancellationCard";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";

export default function EditBookingCancellationCard({
    data,
}: {
    data: BookingDetailsData;
}) {
    return <BookingCancellationCard data={data} />;
}
