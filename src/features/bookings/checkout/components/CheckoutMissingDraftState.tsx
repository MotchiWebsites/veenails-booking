import AppErrorState from "@/components/shared/feedback/AppErrorState";

export default function CheckoutMissingDraftState() {
    return (
        <AppErrorState
            title="Your booking selections were not found"
            description="Please return to the booking flow and choose your appointment details again before checkout."
            secondaryHref="/book"
            secondaryLabel="Start Booking Again"
            showLogo={false}
        />
    );
}
