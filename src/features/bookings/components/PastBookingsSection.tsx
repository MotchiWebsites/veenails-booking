import BookingTableSection from "@/features/bookings/components/BookingTableSection";
import type { MyBookingsPageData } from "@/features/bookings/types/bookings";

export default function PastBookingsSection({
    bookings,
    pagination,
    filters,
}: {
    bookings: MyBookingsPageData["pastBookings"];
    pagination: MyBookingsPageData["pagination"];
    filters: MyBookingsPageData["filters"];
}) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold text-foreground">
                    Booking history
                </h2>
                <p className="mt-1 text-sm text-muted">
                    Search past requests, completed visits, and closed bookings.
                </p>
            </div>

            <BookingTableSection
                bookings={bookings}
                initialSearch={filters.search}
                initialStatus={filters.status}
                pageSize={pagination.pageSize}
                emptyTitle="No booking history yet"
                emptyDescription="Past and closed bookings will appear here once you have some history."
            />
        </section>
    );
}
