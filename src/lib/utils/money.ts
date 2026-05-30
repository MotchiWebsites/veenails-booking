export function formatCurrency(amount: number | string | null | undefined) {
    const numericAmount = Number(amount ?? 0);

    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: 0,
    }).format(numericAmount);
}
