import BookingCard from "@/features/bookings/components/BookingCard";
import EmptyBookingsState from "@/features/bookings/components/EmptyBookingsState";
import type { BookingSummary } from "@/features/bookings/types/bookings";

export default function UpcomingBookingsSection({
    bookings,
}: {
    bookings: BookingSummary[];
}) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold text-foreground">
                    Upcoming bookings
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Requests and appointments that are still in motion.
                </p>
            </div>

            {bookings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {bookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                    ))}
                </div>
            ) : (
                <EmptyBookingsState
                    title="No upcoming bookings"
                    description="When you request or confirm an appointment, it will show up here."
                    showAction
                />
            )}
        </section>
    );
}
