import { FiCalendar } from "react-icons/fi";

import AppErrorState from "@/components/shared/feedback/AppErrorState";
import { requireUser } from "@/features/auth/guards/require-user";
import {
    getAvailableEditBookingSlots,
    getBookingDetailsData,
    getEditBookingDesignTiers,
} from "@/features/bookings/details/data/booking-details";
import EditBookingPage from "@/features/bookings/edit/components/EditBookingPage";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Edit Appointment",
    description: "Request a change to one of your Vee's Nail Studio bookings.",
    path: "/booking",
    noIndex: true,
});

function normalizeBookingReference(value: string) {
    return value.trim().replace(/^#/, "").toUpperCase();
}

function isValidBookingReference(value: string) {
    return /^[A-Z0-9][A-Z0-9-]{2,39}$/.test(value);
}

export default async function EditBookingRoute({
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
                description="We couldn't find a booking you can edit."
                icon={FiCalendar}
                secondaryHref="/booking"
                secondaryLabel="Back to My Bookings"
                showLogo={false}
            />
        );
    }

    const [data, slots, designTiers] = await Promise.all([
        getBookingDetailsData({ bookingReference, userId: user.id }),
        getAvailableEditBookingSlots(),
        getEditBookingDesignTiers(),
    ]);

    if (!data) {
        return (
            <AppErrorState
                title="Booking not found"
                description="We couldn't find a booking you can edit."
                icon={FiCalendar}
                secondaryHref="/booking"
                secondaryLabel="Back to My Bookings"
                showLogo={false}
            />
        );
    }

    return <EditBookingPage data={data} slots={slots} designTiers={designTiers} />;
}
