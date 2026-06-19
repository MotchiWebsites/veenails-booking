"use client";

import { useMemo, useSyncExternalStore } from "react";
import { buildSlotFromDraft } from "@/features/bookings/checkout/utils/checkout-formatters";
import {
    readBookingCheckoutDraft,
    readBookingCheckoutDraftRaw,
} from "@/lib/booking/checkout-draft";

export function subscribeToCheckoutDraft(callback: () => void) {
    if (typeof window === "undefined") {
        return () => {};
    }

    const handleStorage = (event: StorageEvent) => {
        if (event.key) {
            callback();
        }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
        window.removeEventListener("storage", handleStorage);
    };
}

export function useBookingCheckoutDraft() {
    const isClient = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    const draftRaw = useSyncExternalStore(
        subscribeToCheckoutDraft,
        readBookingCheckoutDraftRaw,
        () => null,
    );

    const draft = useMemo(() => {
        if (!draftRaw) {
            return null;
        }

        return readBookingCheckoutDraft();
    }, [draftRaw]);

    const slot = useMemo(
        () => (draft ? buildSlotFromDraft(draft) : null),
        [draft],
    );

    return {
        isClient,
        draft,
        slot,
    };
}
