import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request: NextRequest) {
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase environment variables.");
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet, headers) {
                // Make refreshed tokens available to the route or Server Action
                // handling this same request.
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });

                supabaseResponse = NextResponse.next({
                    request,
                });

                cookiesToSet.forEach(({ name, value, options }) => {
                    supabaseResponse.cookies.set(name, value, options);
                });

                // Supabase marks responses that update auth cookies as private
                // and non-cacheable so a CDN cannot replay another user's session.
                Object.entries(headers).forEach(([name, value]) => {
                    supabaseResponse.headers.set(name, value);
                });
            },
        },
    });

    const { error } = await supabase.auth.getClaims();

    // A missing session is the normal logged-out state, not an operational
    // failure worth sending to the logs.
    if (error && error.name !== "AuthSessionMissingError") {
        console.warn("[auth-proxy] Session validation failed", {
            path: request.nextUrl.pathname,
            code: error.code,
            status: error.status,
            message: error.message,
        });
    }

    return supabaseResponse;
}
