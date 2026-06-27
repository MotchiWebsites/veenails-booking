import type { AvailableAppointmentSlot } from "@/features/bookings/new-booking/types";
import type { BookingCheckoutDraft } from "@/lib/booking/checkout-draft";
import { formatCurrency } from "@/lib/utils/money";

export function formatAmount(amount: number, forceCents = false) {
    const hasCents = !Number.isInteger(amount);

    return formatCurrency(amount, {
        minimumFractionDigits: forceCents || hasCents ? 2 : 0,
        maximumFractionDigits: forceCents || hasCents ? 2 : 0,
    });
}

export function buildSlotFromDraft(
    draft: BookingCheckoutDraft,
): AvailableAppointmentSlot {
    return {
        id: draft.slotId ?? "",
        startsAt: draft.slotStartsAt,
        endsAt: draft.slotEndsAt,
        availability: "available",
    };
}
