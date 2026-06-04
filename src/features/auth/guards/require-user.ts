import { redirect } from "next/navigation";
import { getUser } from "@/features/auth/guards/get-user";

type RequireUserOptions = {
    redirectTo?: string;
};

/**
 * Requires a logged-in user.
 *
 * Use in Server Components, server actions, and route handlers where the user
 * must be authenticated before continuing.
 */
export async function requireUser(options: RequireUserOptions = {}) {
    const user = await getUser();

    if (!user) {
        redirect(options.redirectTo ?? "/login");
    }

    return user;
}
