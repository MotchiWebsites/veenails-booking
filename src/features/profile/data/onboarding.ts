import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getProfileOnboardingState(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("profiles")
        .select(
            "id, email, display_name, phone, instagram_handle, preferred_contact_method, profile_completed_at",
        )
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error("[profile-onboarding] Could not load profile", {
            userId,
            code: error.code,
            message: error.message,
        });
        return null;
    }

    return data;
}
