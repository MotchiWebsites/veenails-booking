export function maskEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const [localPart, domain] = normalizedEmail.split("@");

    if (!localPart || !domain) {
        return "[invalid-email]";
    }

    const visibleStart = localPart.slice(0, Math.min(3, localPart.length));
    const maskedPart = "*".repeat(Math.max(localPart.length - visibleStart.length, 3));

    return `${visibleStart}${maskedPart}@${domain}`;
}
