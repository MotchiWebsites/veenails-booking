import { buildMetadata } from "@/lib/seo/metadata";
import BookingAppointmentFlow from "@/features/bookings/new-booking/BookingAppointmentFlow";
import { getNewBookingPageData } from "@/features/bookings/new-booking/data";

export const metadata = buildMetadata({
    title: "Book Appointment",
    description:
        "Choose a time, select your service, and review your appointment estimate before checkout.",
    path: "/book",
    noIndex: true,
});

export default async function BookPage() {
    const { slots, settings, designTiers } = await getNewBookingPageData();

    return (
        <BookingAppointmentFlow
            slots={slots}
            settings={settings}
            designTiers={designTiers}
            checkoutHref={null}
        />
    );
}
