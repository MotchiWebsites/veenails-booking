"use client";

import { FcGoogle } from "react-icons/fc";
import { createClient } from "@/lib/supabase/client";

function getClientBaseUrl() {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }

    return (
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000"
    );
}

export default function GoogleSignInButton() {
    const handleGoogleSignIn = async () => {
        const supabase = createClient();

        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${getClientBaseUrl()}/auth/callback`,
            },
        });
    };

    return (
        <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn-secondary w-full"
        >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
        </button>
    );
}
