import "server-only";

import { STUDIO_TIME_ZONE } from "@/lib/utils/studio-time";

export const GOOGLE_CALENDAR_TIME_ZONE = STUDIO_TIME_ZONE;
export const GOOGLE_CALENDAR_FALLBACK_DURATION_MINUTES = 4 * 60;
export const GOOGLE_CALENDAR_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
] as const;

export function getGoogleCalendarConfig() {
    return {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? "",
        encryptionKey: process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY ?? "",
    };
}

export function requireGoogleCalendarConfig() {
    const config = getGoogleCalendarConfig();
    if (
        !config.clientId ||
        !config.clientSecret ||
        !config.redirectUri ||
        !config.encryptionKey
    ) {
        throw new Error("Google Calendar is not configured.");
    }
    return config;
}
