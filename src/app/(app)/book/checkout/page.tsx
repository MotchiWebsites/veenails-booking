import { buildMetadata } from "@/lib/seo/metadata";
import BookingCheckoutPage from "@/features/bookings/checkout/BookingCheckoutPage";
import { getBookingCheckoutPageData } from "@/features/bookings/checkout/data";

export const metadata = buildMetadata({
    title: "Confirm Deposit",
    description:
        "Confirm your Interac e-Transfer deposit and send your booking request to Vee's Nail Studio.",
    path: "/book/checkout",
    noIndex: true,
});

export default async function BookCheckoutRoute() {
    const { settings, designTiers } = await getBookingCheckoutPageData();

    return (
        <BookingCheckoutPage settings={settings} designTiers={designTiers} />
    );
}
