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

export default async function BookPage({
    searchParams,
}: {
    searchParams: Promise<{
        slotId?: string | string[];
        step?: string | string[];
    }>;
}) {
    const params = await searchParams;
    const { slots, settings, designTiers } = await getNewBookingPageData();
    const slotId = Array.isArray(params.slotId)
        ? (params.slotId[0] ?? null)
        : (params.slotId ?? null);
    const initialStep = Array.isArray(params.step)
        ? (params.step[0] ?? null)
        : (params.step ?? null);

    return (
        <BookingAppointmentFlow
            slots={slots}
            settings={settings}
            designTiers={designTiers}
            initialSlotId={slotId}
            initialStep={initialStep === "review" ? "review" : null}
            checkoutHref="/book/checkout"
        />
    );
}
