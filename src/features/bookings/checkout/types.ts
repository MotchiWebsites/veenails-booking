export type BookingCheckoutActionState = {
    error?: string;
    success?: string;
    messageId?: string;
    bookingReference?: string;
    startsAt?: string;
    endsAt?: string;
    depositAmount?: number;
};
