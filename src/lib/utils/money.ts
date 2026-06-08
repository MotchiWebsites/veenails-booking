type FormatCurrencyOptions = {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
};

export function formatCurrency(
    amount: number | string | null | undefined,
    options: FormatCurrencyOptions = {},
) {
    const numericAmount = Number(amount ?? 0);
    const { minimumFractionDigits, maximumFractionDigits = 0 } = options;

    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(numericAmount);
}
