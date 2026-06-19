import { redirect } from "next/navigation";
import { getAdminContextForUser } from "@/features/admin/auth/admin-auth";
import { requireUser } from "@/features/auth/guards/require-user";

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

    const admin = await getAdminContextForUser(user.id);

    if (!admin) {
        redirect(options.unauthorizedRedirectTo ?? "/dashboard");
    }

    return {
        user,
        admin: {
            role: admin.role as AppAdminRole,
            active: admin.active,
        },
    };
}
