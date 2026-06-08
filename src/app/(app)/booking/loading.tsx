import AppLoadingScreen from "@/components/shared/loading/AppLoadingScreen";

export default function BookingLoading() {
    return (
        <AppLoadingScreen
            title="Loading your bookings"
            description="We're getting your appointment requests and booking history ready."
        />
    );
}
