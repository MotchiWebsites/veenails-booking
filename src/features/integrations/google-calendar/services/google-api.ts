import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptGoogleRefreshToken } from "@/features/integrations/google-calendar/utils/crypto";
import { requireGoogleCalendarConfig } from "@/features/integrations/google-calendar/utils/config";

const API_ROOT = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly reconnectRequired = false,
    ) {
        super(message);
    }
}

export type GoogleCalendarListItem = {
    id: string;
    summary: string;
    primary?: boolean;
    accessRole: "owner" | "writer" | "reader" | "freeBusyReader";
};

export type GoogleCalendarEventInput = {
    summary: string;
    description: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    transparency: "transparent" | "opaque";
    status: "confirmed";
    reminders: {
        useDefault: false;
        overrides: Array<{ method: "popup"; minutes: number }>;
    };
};

async function parseGoogleFailure(response: Response) {
    let reason = "google_api_error";
    try {
        const body = (await response.json()) as {
            error?: { status?: string; errors?: Array<{ reason?: string }> };
        };
        reason =
            body.error?.errors?.[0]?.reason ??
            body.error?.status ??
            reason;
    } catch {
        // Google occasionally returns a non-JSON proxy response.
    }
    return new GoogleCalendarApiError(reason, response.status);
}

export async function exchangeGoogleAuthorizationCode(code: string) {
    const config = requireGoogleCalendarConfig();
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri,
            grant_type: "authorization_code",
        }),
        cache: "no-store",
    });
    if (!response.ok) throw await parseGoogleFailure(response);
    return (await response.json()) as {
        access_token: string;
        refresh_token?: string;
    };
}

export async function refreshGoogleAccessToken(
    integrationId: string,
    encryptedRefreshToken: string,
) {
    const config = requireGoogleCalendarConfig();
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: decryptGoogleRefreshToken(encryptedRefreshToken),
            grant_type: "refresh_token",
        }),
        cache: "no-store",
    });
    if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
            await createAdminClient()
                .from("google_calendar_integrations")
                .update({
                    needs_reconnect: true,
                    last_sync_error: "reconnect_required",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", integrationId);
            throw new GoogleCalendarApiError(
                "reconnect_required",
                response.status,
                true,
            );
        }
        throw await parseGoogleFailure(response);
    }
    const tokens = (await response.json()) as { access_token: string };
    return tokens.access_token;
}

async function googleFetch<T>(
    accessToken: string,
    path: string,
    init?: RequestInit,
) {
    const response = await fetch(`${API_ROOT}${path}`, {
        ...init,
        headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
            ...init?.headers,
        },
        cache: "no-store",
    });
    if (!response.ok) throw await parseGoogleFailure(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
}

export async function listWritableGoogleCalendars(accessToken: string) {
    const calendars: GoogleCalendarListItem[] = [];
    let pageToken = "";
    do {
        const params = new URLSearchParams({
            minAccessRole: "writer",
            maxResults: "250",
        });
        if (pageToken) params.set("pageToken", pageToken);
        const page = await googleFetch<{
            items?: GoogleCalendarListItem[];
            nextPageToken?: string;
        }>(accessToken, `/users/me/calendarList?${params}`);
        calendars.push(...(page.items ?? []));
        pageToken = page.nextPageToken ?? "";
    } while (pageToken);
    return calendars;
}

export function insertGoogleCalendarEvent(
    accessToken: string,
    calendarId: string,
    event: GoogleCalendarEventInput,
    eventId?: string,
) {
    return googleFetch<{ id: string }>(
        accessToken,
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        {
            method: "POST",
            body: JSON.stringify(eventId ? { ...event, id: eventId } : event),
        },
    );
}

export function updateGoogleCalendarEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: GoogleCalendarEventInput,
) {
    return googleFetch<{ id: string }>(
        accessToken,
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        { method: "PUT", body: JSON.stringify(event) },
    );
}

export async function removeGoogleCalendarEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
) {
    try {
        await googleFetch<void>(
            accessToken,
            `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
            { method: "DELETE" },
        );
    } catch (error) {
        if (
            error instanceof GoogleCalendarApiError &&
            (error.status === 404 || error.status === 410)
        ) {
            return;
        }
        throw error;
    }
}
