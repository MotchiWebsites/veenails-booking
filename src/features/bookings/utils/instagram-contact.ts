export const INSTAGRAM_ARRIVAL_MESSAGE =
    "Need arrival details or have a question before your appointment? Message us on Instagram.";

export const INSTAGRAM_ARRIVAL_FALLBACK =
    "Message us on Instagram for arrival details.";

export function normalizeInstagramUrl(value: string | null | undefined) {
    const candidate = value?.trim();

    if (!candidate) {
        return null;
    }

    try {
        const url = new URL(candidate);
        const hostname = url.hostname.toLowerCase();
        const isInstagramHost =
            hostname === "ig.me" ||
            hostname === "instagram.com" ||
            hostname.endsWith(".instagram.com");

        return url.protocol === "https:" && isInstagramHost
            ? url.toString()
            : null;
    } catch {
        return null;
    }
}
