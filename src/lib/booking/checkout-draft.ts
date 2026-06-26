import type { BookingSelections } from "@/features/bookings/new-booking/types";

export const BOOKING_CHECKOUT_DRAFT_KEY = "vns-booking-checkout-draft";

export type BookingCheckoutDraft = BookingSelections & {
    version: 1;
    savedAt: string;
    slotStartsAt: string;
    slotEndsAt: string | null;
};

export function isBookingCheckoutDraft(
    value: unknown,
): value is BookingCheckoutDraft {
    if (!value || typeof value !== "object") {
        return false;
    }

    const draft = value as Partial<BookingCheckoutDraft>;

    return (
        draft.version === 1 &&
        typeof draft.savedAt === "string" &&
        typeof draft.slotId === "string" &&
        typeof draft.slotStartsAt === "string" &&
        (typeof draft.slotEndsAt === "string" || draft.slotEndsAt === null)
    );
}

export function readBookingCheckoutDraft() {
    if (typeof window === "undefined") {
        return null;
    }

    const rawValue = window.localStorage.getItem(BOOKING_CHECKOUT_DRAFT_KEY);

    if (!rawValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawValue) as unknown;
        return isBookingCheckoutDraft(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function writeBookingCheckoutDraft(draft: BookingCheckoutDraft) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(
        BOOKING_CHECKOUT_DRAFT_KEY,
        JSON.stringify(draft),
    );
}

export function clearBookingCheckoutDraft() {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(BOOKING_CHECKOUT_DRAFT_KEY);
}

export function readBookingCheckoutDraftRaw() {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(BOOKING_CHECKOUT_DRAFT_KEY);
}
