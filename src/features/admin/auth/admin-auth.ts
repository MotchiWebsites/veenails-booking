import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/supabase";

export type AdminContext = {
    role: Enums<"app_role">;
    active: boolean;
};

export async function getAdminContextForUser(
    userId: string,
): Promise<AdminContext | null> {
    const admin = createAdminClient();

    const { data, error } = await admin
        .from("admin_users")
        .select("role, active")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle()
        .overrideTypes<AdminContext | null>();

    if (error) {
        console.error("[admin-auth:get-admin-context]", error);
        return null;
    }

    return data;
}

export async function isAdminUser(userId: string) {
    return Boolean(await getAdminContextForUser(userId));
}
