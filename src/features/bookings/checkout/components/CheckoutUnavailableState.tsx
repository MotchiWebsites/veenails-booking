import AppErrorState from "@/components/shared/feedback/AppErrorState";

export default function CheckoutUnavailableState() {
    return (
        <AppErrorState
            title="Checkout is unavailable"
            description="Booking settings could not be loaded right now. Please try again shortly."
            secondaryHref="/book"
            secondaryLabel="Start Booking Again"
            showLogo={false}
        />
    );
}
