import "server-only";

import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    listWritableGoogleCalendars,
    refreshGoogleAccessToken,
} from "@/features/integrations/google-calendar/services/google-api";
import { getGoogleCalendarConfig } from "@/features/integrations/google-calendar/utils/config";

export type GoogleCalendarSettingsData = {
    configured: boolean;
    connected: boolean;
    pendingSelection: boolean;
    googleEmail: string | null;
    calendarId: string | null;
    calendarName: string | null;
    lastSyncAt: string | null;
    syncState: "synced" | "attention" | "reconnect" | "not_connected";
    calendars: Array<{ id: string; name: string; primary: boolean }>;
};

export async function getGoogleCalendarSettingsData(): Promise<GoogleCalendarSettingsData> {
    const { user } = await requireAdmin();
    const config = getGoogleCalendarConfig();
    const configured = Boolean(
        config.clientId &&
            config.clientSecret &&
            config.redirectUri &&
            config.encryptionKey,
    );
    const admin = createAdminClient();
    const { data, error } = await admin
        .from("google_calendar_integrations")
        .select(
            "id, admin_user_id, google_email, calendar_id, calendar_name, encrypted_refresh_token, is_active, needs_reconnect, last_sync_at, last_sync_error",
        )
        .or(`is_active.eq.true,admin_user_id.eq.${user.id}`)
        .order("is_active", { ascending: false })
        .order("connected_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            admin_user_id: string;
            google_email: string | null;
            calendar_id: string;
            calendar_name: string;
            encrypted_refresh_token: string;
            is_active: boolean;
            needs_reconnect: boolean;
            last_sync_at: string | null;
            last_sync_error: string | null;
        } | null>();

    if (error) {
        console.error("[google-calendar:settings-data]", {
            code: error.code,
        });
        return {
            configured,
            connected: false,
            pendingSelection: false,
            googleEmail: null,
            calendarId: null,
            calendarName: null,
            lastSyncAt: null,
            syncState: "not_connected",
            calendars: [],
        };
    }

    let calendars: GoogleCalendarSettingsData["calendars"] = [];
    if (data && configured && !data.needs_reconnect) {
        try {
            const accessToken = await refreshGoogleAccessToken(
                data.id,
                data.encrypted_refresh_token,
            );
            calendars = (await listWritableGoogleCalendars(accessToken)).map(
                (calendar) => ({
                    id: calendar.id,
                    name: calendar.summary,
                    primary: Boolean(calendar.primary),
                }),
            );
        } catch (calendarError) {
            console.error("[google-calendar:list-settings]", {
                reason:
                    calendarError instanceof Error
                        ? calendarError.name
                        : "unknown",
            });
        }
    }

    return {
        configured,
        connected: Boolean(data?.is_active),
        pendingSelection: Boolean(data && !data.is_active),
        googleEmail: data?.google_email ?? null,
        calendarId: data?.calendar_id ?? null,
        calendarName: data?.calendar_name ?? null,
        lastSyncAt: data?.last_sync_at ?? null,
        syncState: !data
            ? "not_connected"
            : data.needs_reconnect
              ? "reconnect"
              : data.last_sync_error
                ? "attention"
                : data.is_active
                  ? "synced"
                  : "not_connected",
        calendars,
    };
}
