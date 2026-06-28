import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createGoogleOAuthState } from "@/features/integrations/google-calendar/utils/crypto";
import {
    GOOGLE_CALENDAR_SCOPES,
    requireGoogleCalendarConfig,
} from "@/features/integrations/google-calendar/utils/config";

export async function GET(request: NextRequest) {
    const { user } = await requireAdmin();
    try {
        const config = requireGoogleCalendarConfig();
        const authorizationUrl = new URL(
            "https://accounts.google.com/o/oauth2/v2/auth",
        );
        authorizationUrl.search = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: "code",
            scope: GOOGLE_CALENDAR_SCOPES.join(" "),
            access_type: "offline",
            include_granted_scopes: "true",
            state: createGoogleOAuthState(user.id),
            ...(request.nextUrl.searchParams.get("reconnect") === "1"
                ? { prompt: "consent" }
                : {}),
        }).toString();
        return NextResponse.redirect(authorizationUrl);
    } catch {
        return NextResponse.redirect(
            new URL("/admin/settings?googleCalendar=not_configured", request.url),
        );
    }
}
