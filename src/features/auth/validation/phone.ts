export function getPhoneDigits(value: string) {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("1") && digits.length > 10) {
        digits = digits.slice(1);
    }

    return digits.slice(0, 10);
}

export function formatNorthAmericanPhone(value: string) {
    const digits = getPhoneDigits(value);

    if (!digits) return "";

    if (digits.length <= 3) {
        return `(${digits}`;
    }

    if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isCompleteNorthAmericanPhone(value: string) {
    return getPhoneDigits(value).length === 10;
}

export function normalizeNorthAmericanPhone(value: string) {
    const digits = getPhoneDigits(value);

    if (digits.length !== 10) return null;

    return `+1${digits}`;
}
