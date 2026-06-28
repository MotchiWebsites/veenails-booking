import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/features/auth/guards/get-user";
import { isAdminUser } from "@/features/admin/auth/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    exchangeGoogleAuthorizationCode,
    listWritableGoogleCalendars,
} from "@/features/integrations/google-calendar/services/google-api";
import {
    encryptGoogleRefreshToken,
    verifyGoogleOAuthState,
} from "@/features/integrations/google-calendar/utils/crypto";

function settingsRedirect(request: NextRequest, result: string) {
    return NextResponse.redirect(
        new URL(`/admin/settings?googleCalendar=${result}`, request.url),
    );
}

export async function GET(request: NextRequest) {
    const user = await getUser();
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    if (
        !user ||
        !(await isAdminUser(user.id)) ||
        !code ||
        !state ||
        !verifyGoogleOAuthState(state, user.id)
    ) {
        return settingsRedirect(request, "invalid_state");
    }

    try {
        const admin = createAdminClient();
        const [tokens, existingResult] = await Promise.all([
            exchangeGoogleAuthorizationCode(code),
            admin
                .from("google_calendar_integrations")
                .select("encrypted_refresh_token")
                .eq("admin_user_id", user.id)
                .maybeSingle()
                .overrideTypes<{
                    encrypted_refresh_token: string;
                } | null>(),
        ]);
        const encryptedRefreshToken = tokens.refresh_token
            ? encryptGoogleRefreshToken(tokens.refresh_token)
            : existingResult.data?.encrypted_refresh_token;
        if (!encryptedRefreshToken) {
            return settingsRedirect(request, "reconnect_required");
        }
        const calendars = await listWritableGoogleCalendars(tokens.access_token);
        if (!calendars.length) {
            return settingsRedirect(request, "no_writable_calendars");
        }
        const primary = calendars.find((calendar) => calendar.primary) ?? calendars[0];
        const googleEmail =
            calendars.find((calendar) => calendar.primary)?.id ?? user.email ?? null;
        const { error } = await admin
            .from("google_calendar_integrations")
            .upsert(
                {
                    admin_user_id: user.id,
                    google_email: googleEmail,
                    calendar_id: primary.id,
                    calendar_name: primary.summary,
                    encrypted_refresh_token: encryptedRefreshToken,
                    is_active: false,
                    needs_reconnect: false,
                    connected_at: new Date().toISOString(),
                    last_sync_error: null,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "admin_user_id" },
            );
        if (error) throw error;
        return settingsRedirect(request, "choose_calendar");
    } catch (error) {
        console.error("[google-calendar:callback]", {
            reason: error instanceof Error ? error.name : "unknown",
        });
        return settingsRedirect(request, "connection_failed");
    }
}
