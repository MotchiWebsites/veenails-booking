import AppLoadingScreen from "@/components/shared/loading/AppLoadingScreen";

export default function BookLoading() {
    return (
        <AppLoadingScreen
            title="Loading appointment slots"
            description="We're getting the latest availability and booking details ready for you."
        />
    );
}
