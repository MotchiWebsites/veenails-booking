import { FiCalendar } from "react-icons/fi";

import AppErrorState from "@/components/shared/feedback/AppErrorState";
import { requireUser } from "@/features/auth/guards/require-user";
import BookingDetailsPage from "@/features/bookings/details/components/BookingDetailsPage";
import { getBookingDetailsData } from "@/features/bookings/details/data/booking-details";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Booking Details",
    description: "View one of your Vee's Nail Studio bookings.",
    path: "/booking",
    noIndex: true,
});

function normalizeBookingReference(value: string) {
    return value.trim().replace(/^#/, "").toUpperCase();
}

function isValidBookingReference(value: string) {
    return /^[A-Z0-9][A-Z0-9-]{2,39}$/.test(value);
}

export default async function BookingDetailsRoute({
    params,
}: {
    params: Promise<{ bookingReference: string }>;
}) {
    const user = await requireUser();
    const { bookingReference: bookingReferenceParam } = await params;
    const bookingReference = normalizeBookingReference(bookingReferenceParam);

    if (!isValidBookingReference(bookingReference)) {
        return (
            <AppErrorState
                title="Booking not found"
                description="We couldn't find a booking you can view."
                icon={FiCalendar}
                secondaryHref="/booking"
                secondaryLabel="Back to My Bookings"
                showLogo={false}
            />
        );
    }

    const data = await getBookingDetailsData({
        bookingReference,
        userId: user.id,
    });

    if (!data) {
        return (
            <AppErrorState
                title="Booking not found"
                description="We couldn't find a booking you can view."
                icon={FiCalendar}
                secondaryHref="/booking"
                secondaryLabel="Back to My Bookings"
                showLogo={false}
            />
        );
    }

    return <BookingDetailsPage data={data} />;
}
