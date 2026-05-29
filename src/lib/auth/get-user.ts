import { createClient } from "@/lib/supabase/server";

/**
 * Returns the currently authenticated Supabase user.
 *
 * Use this when a route/page can work with or without a logged-in user.
 * For protected routes, use requireUser() instead.
 */
export async function getUser() {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
}
