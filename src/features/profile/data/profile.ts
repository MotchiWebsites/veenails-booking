import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, phone, created_at, updated_at")
        .eq("id", user.id)
        .single();

    if (error) {
        return null;
    }

    return data;
}
