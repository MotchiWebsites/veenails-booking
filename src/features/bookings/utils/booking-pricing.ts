import type { BookingSummary } from "@/features/bookings/types/bookings";

export function getBookingDiscounts(booking: BookingSummary) {
    return booking.lineItems
        .filter((item) => item.itemType === "discount" && item.lineTotal < 0)
        .map((item) => ({
            id: item.id,
            label: item.label,
            reason: item.description,
            amount: Math.abs(item.lineTotal),
        }));
}

export function getBookingSubtotalBeforeDiscount(booking: BookingSummary) {
    return booking.lineItems
        .filter(
            (item) =>
                item.itemType !== "discount" && item.itemType !== "fee",
        )
        .reduce((total, item) => total + item.lineTotal, 0);
}

export function getBookingDiscountTotal(booking: BookingSummary) {
    return getBookingDiscounts(booking).reduce(
        (total, discount) => total + discount.amount,
        0,
    );
}
