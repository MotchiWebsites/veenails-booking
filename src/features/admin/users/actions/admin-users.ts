"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateRegularCustomerAction(formData: FormData) {
    await requireAdmin();

    const userId = String(formData.get("userId") ?? "");
    const isRegular = formData.getAll("isRegular").includes("on");

    if (!userId) {
        return;
    }

    const admin = createAdminClient();
    const { error } = await admin
        .from("profiles")
        .update({
            is_regular: isRegular,
            regular_since: isRegular ? new Date().toISOString() : null,
        })
        .eq("id", userId);

    if (error) {
        console.error("[admin:users:regular-status]", error);
        throw new Error("We couldn't update regular customer status.");
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
}
