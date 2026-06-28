"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    listWritableGoogleCalendars,
    refreshGoogleAccessToken,
} from "@/features/integrations/google-calendar/services/google-api";
import { decryptGoogleRefreshToken } from "@/features/integrations/google-calendar/utils/crypto";
import {
    syncAvailabilitySlotToGoogleCalendar,
    syncBookingToGoogleCalendar,
} from "@/features/integrations/google-calendar/services/sync";

export type GoogleCalendarActionState = {
    error: string;
    success: string;
    messageId: string;
    calendarId?: string;
    calendarName?: string;
};

function result(
    input: Omit<GoogleCalendarActionState, "messageId">,
): GoogleCalendarActionState {
    return {
        ...input,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

export async function selectGoogleCalendarAction(
    _previous: GoogleCalendarActionState,
    formData: FormData,
): Promise<GoogleCalendarActionState> {
    const { user } = await requireAdmin();
    const calendarId = String(formData.get("calendarId") ?? "");
    if (!calendarId) {
        return result({ error: "Choose a calendar.", success: "" });
    }
    const admin = createAdminClient();
    const { data: integration, error } = await admin
        .from("google_calendar_integrations")
        .select("id, encrypted_refresh_token")
        .or(`is_active.eq.true,admin_user_id.eq.${user.id}`)
        .order("is_active", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            encrypted_refresh_token: string;
        } | null>();
    if (error || !integration) {
        return result({
            error: "Reconnect Google Calendar and try again.",
            success: "",
        });
    }

    try {
        const accessToken = await refreshGoogleAccessToken(
            integration.id,
            integration.encrypted_refresh_token,
        );
        const calendar = (await listWritableGoogleCalendars(accessToken)).find(
            (item) => item.id === calendarId,
        );
        if (!calendar) {
            return result({
                error: "Choose a calendar you can edit.",
                success: "",
            });
        }
        await admin
            .from("google_calendar_integrations")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("is_active", true);
        const { error: updateError } = await admin
            .from("google_calendar_integrations")
            .update({
                calendar_id: calendar.id,
                calendar_name: calendar.summary,
                is_active: true,
                needs_reconnect: false,
                last_sync_error: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", integration.id);
        if (updateError) throw updateError;
        revalidatePath("/admin/settings");
        return result({
            error: "",
            success: "Google Calendar connected.",
            calendarId: calendar.id,
            calendarName: calendar.summary,
        });
    } catch (selectionError) {
        console.error("[google-calendar:select]", {
            reason:
                selectionError instanceof Error
                    ? selectionError.name
                    : "unknown",
        });
        return result({
            error: "We couldn't save that calendar. Reconnect and try again.",
            success: "",
        });
    }
}

export async function disconnectGoogleCalendarAction(
    _previous: GoogleCalendarActionState,
): Promise<GoogleCalendarActionState> {
    void _previous;
    await requireAdmin();
    const admin = createAdminClient();
    const { data: integration } = await admin
        .from("google_calendar_integrations")
        .select("id, encrypted_refresh_token")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            encrypted_refresh_token: string;
        } | null>();
    if (!integration) {
        return result({ error: "", success: "Google Calendar is disconnected." });
    }
    try {
        const token = decryptGoogleRefreshToken(
            integration.encrypted_refresh_token,
        );
        await fetch("https://oauth2.googleapis.com/revoke", {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ token }),
            cache: "no-store",
        });
    } catch {
        // Local disconnect still proceeds if Google is unavailable.
    }
    const { error } = await admin
        .from("google_calendar_integrations")
        .delete()
        .eq("id", integration.id);
    if (error) {
        return result({
            error: "We couldn't disconnect Google Calendar.",
            success: "",
        });
    }
    revalidatePath("/admin/settings");
    return result({ error: "", success: "Google Calendar disconnected." });
}

export async function retryGoogleCalendarSyncAction(formData: FormData) {
    await requireAdmin();
    const entity = String(formData.get("entity") ?? "");
    const entityId = String(formData.get("entityId") ?? "");
    if (!entityId || !["booking", "slot"].includes(entity)) return;
    if (entity === "booking") {
        await syncBookingToGoogleCalendar(entityId);
        revalidatePath(`/admin/appointments/${entityId}`);
    } else {
        await syncAvailabilitySlotToGoogleCalendar(entityId);
        revalidatePath("/admin/availability");
    }
}
