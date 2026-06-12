import { buildMetadata } from "@/lib/seo/metadata";
import BookingCheckoutPage from "@/features/bookings/checkout/BookingCheckoutPage";
import { getBookingCheckoutPageData } from "@/features/bookings/checkout/data";
import { requireUser } from "@/features/auth/guards/require-user";
import { getCreditsPageData } from "@/features/credits/data/credits";

export const metadata = buildMetadata({
    title: "Confirm Deposit",
    description:
        "Confirm your Interac e-Transfer deposit and send your booking request to Vee's Nail Studio.",
    path: "/book/checkout",
    noIndex: true,
});

export default async function BookCheckoutRoute() {
    const user = await requireUser();
    const { settings, designTiers, userEmail } =
        await getBookingCheckoutPageData();
    const credits = await getCreditsPageData(user.id);

    return (
        <BookingCheckoutPage
            settings={settings}
            designTiers={designTiers}
            credits={credits}
            userEmail={userEmail}
        />
    );
}
