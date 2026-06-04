import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";

type RequireAdminOptions = {
    loginRedirectTo?: string;
    unauthorizedRedirectTo?: string;
};

export type AppAdminRole = "owner" | "admin" | "staff" | "viewer";

/**
 * Requires the current user to be an active app admin.
 *
 * This is for server-side route protection and UI gating. Database access is
 * still protected by RLS, so this should be treated as a routing helper rather
 * than the only security layer.
 */
export async function requireAdmin(options: RequireAdminOptions = {}) {
    const user = await requireUser({
        redirectTo: options.loginRedirectTo ?? "/login",
    });

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("admin_users")
        .select("role, active")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

    if (error || !data) {
        redirect(options.unauthorizedRedirectTo ?? "/dashboard");
    }

    return {
        user,
        admin: {
            role: data.role as AppAdminRole,
            active: data.active,
        },
    };
}
