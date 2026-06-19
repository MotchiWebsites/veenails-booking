import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/features/auth/lib/redirects";
import { isAdminUser } from "@/features/admin/auth/admin-auth";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    let next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

    if (code) {
        const supabase = await createClient();

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user && !requestUrl.searchParams.get("next") && await isAdminUser(user.id)) {
            next = "/admin";
        }
    }

    return NextResponse.redirect(new URL(next, request.url));
}
