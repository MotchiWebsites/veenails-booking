import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("[profile:getCurrentProfile.getUser]", {
            message: userError?.message,
            hasUser: Boolean(user),
        });

        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select(
            "id, display_name, email, phone, instagram_handle, preferred_contact_method, created_at, updated_at",
        )
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("[profile:getCurrentProfile.profile]", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            userId: user.id,
        });

        return null;
    }

    return data;
}
