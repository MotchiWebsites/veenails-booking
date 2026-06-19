import { formatCurrency } from "@/lib/utils/money";

export function formatEstimateAmount(amount: number, forceCents = false) {
    const hasCents = !Number.isInteger(amount);

    return formatCurrency(amount, {
        minimumFractionDigits: forceCents || hasCents ? 2 : 0,
        maximumFractionDigits: forceCents || hasCents ? 2 : 0,
    });
}

export function formatPrice(amount: number) {
    return formatCurrency(amount, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
