import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/update-session";

export async function proxy(request: NextRequest) {
    return updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Run middleware on all routes except:
         * - Next static assets
         * - image optimizer files
         * - favicon/static public files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
