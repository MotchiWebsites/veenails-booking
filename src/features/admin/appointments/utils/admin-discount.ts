import { normalizeBookingFeeRate } from "@/features/bookings/new-booking/utils";

export function roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
}

export function parseAdminDiscountPercentage({
    label,
    fallbackAmount,
    subtotal,
}: {
    label: string;
    fallbackAmount: number;
    subtotal: number;
}) {
    const match = label.match(/\(([\d.]+)%\)/);
    if (match) {
        const parsed = Number(match[1]);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) {
            return roundCurrency(parsed);
        }
    }

    if (subtotal > 0 && fallbackAmount > 0) {
        return Math.min(
            100,
            roundCurrency((fallbackAmount / subtotal) * 100),
        );
    }

    return null;
}

export function calculateAdminDiscountedPricing({
    subtotal,
    discountPercentage,
    bookingFeeMode,
    bookingFeeRate,
    amountPaid = 0,
}: {
    subtotal: number;
    discountPercentage: number;
    bookingFeeMode: "added_on_top" | "included_in_price";
    bookingFeeRate: number;
    amountPaid?: number;
}) {
    const normalizedSubtotal = Math.max(0, roundCurrency(subtotal));
    const normalizedPercentage = Math.min(
        100,
        Math.max(0, discountPercentage),
    );
    const discountAmount = Math.min(
        normalizedSubtotal,
        roundCurrency(
            (normalizedSubtotal * normalizedPercentage) / 100,
        ),
    );
    const discountedSubtotal = Math.max(
        0,
        roundCurrency(normalizedSubtotal - discountAmount),
    );
    const normalizedFeeRate = normalizeBookingFeeRate(bookingFeeRate);
    const bookingFee =
        bookingFeeMode === "included_in_price"
            ? 0
            : roundCurrency(
                  (discountedSubtotal * normalizedFeeRate) / 100,
              );
    const total = Math.max(
        0,
        roundCurrency(discountedSubtotal + bookingFee),
    );

    return {
        subtotal: normalizedSubtotal,
        discountPercentage: normalizedPercentage,
        discountAmount,
        discountedSubtotal,
        bookingFee,
        total,
        amountDue: Math.max(0, roundCurrency(total - amountPaid)),
    };
}
