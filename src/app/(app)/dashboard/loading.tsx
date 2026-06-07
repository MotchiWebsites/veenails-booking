import AppLoadingScreen from "@/components/shared/loading/AppLoadingScreen";

export default function DashboardLoading() {
    return (
        <AppLoadingScreen
            title="Loading your dashboard"
            description="We're getting your bookings, profile, and account details ready."
        />
    );
}
