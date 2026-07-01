"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { createClient } from "@/lib/supabase/client";
import {
    getAuthErrorLogDetails,
    getFriendlyAuthError,
} from "@/features/auth/lib/auth-errors";
import { useToast } from "@/components/shared/toast/ToastProvider";

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
    const [pending, setPending] = useState(false);
    const { error: showError } = useToast();

    const handleGoogleSignIn = async () => {
        if (pending) return;

        setPending(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${getClientBaseUrl()}/auth/callback`,
                },
            });

            if (error) {
                console.warn(
                    "[auth-oauth] Google sign-in failed",
                    getAuthErrorLogDetails(error),
                );
                showError(
                    getFriendlyAuthError(error, "AUTH-OAUTH"),
                    "Google sign-in failed",
                );
                setPending(false);
            }
        } catch (error) {
            console.error(
                "[auth-oauth] Unexpected Google sign-in failure",
                getAuthErrorLogDetails(error),
            );
            showError(
                "We couldn’t start Google sign-in. Please try again. If it continues, share code AUTH-OAUTH.",
                "Google sign-in failed",
            );
            setPending(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={pending}
            className="btn-secondary w-full"
        >
            <FcGoogle className="h-5 w-5" />
            {pending ? "Opening Google..." : "Continue with Google"}
        </button>
    );
}
