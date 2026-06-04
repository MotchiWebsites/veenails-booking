"use server";

import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidEmail } from "@/features/auth/validation/email";
import { getFriendlyAuthError } from "@/features/auth/lib/auth-errors";

import { normalizeNorthAmericanPhone } from "@/features/auth/validation/phone";
import { getPasswordErrorMessage } from "@/features/auth/validation/password";

function getBaseUrl() {
    return (
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000"
    );
}

export type AuthActionState = {
    error?: string;
    success?: string;
    messageId?: string;
};

function createMessageId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function signInWithPassword(
    _prevState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    const email = String(formData.get("email") || "")
        .trim()
        .toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
        return {
            error: "Please enter your email and password.",
            messageId: createMessageId(),
        };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {
            error: getFriendlyAuthError(error.message),
            messageId: createMessageId(),
        };
    }

    redirect(routes.dashboard);
}

export async function signUpWithPassword(
    _prevState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    const fullName = String(formData.get("fullName") || "").trim();

    const rawPhone = String(formData.get("phone") || "").trim();
    const phone = rawPhone ? normalizeNorthAmericanPhone(rawPhone) : null;
    if (rawPhone && !phone) {
        return {
            error: "Please enter a valid +1 phone number.",
            messageId: createMessageId(),
        };
    }

    const email = String(formData.get("email") || "")
        .trim()
        .toLowerCase();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const acceptedTerms = formData.get("acceptedTerms") === "on";

    if (!acceptedTerms) {
        return {
            error: "Please accept the Terms of Service and Privacy Policy to continue.",
            messageId: createMessageId(),
        };
    }

    if (!fullName || !email || !password || !confirmPassword) {
        return {
            error: "Please fill in all required fields.",
            messageId: createMessageId(),
        };
    }

    if (!isValidEmail(email)) {
        return {
            error: "Please enter a valid email address.",
            messageId: createMessageId(),
        };
    }

    const passwordError = getPasswordErrorMessage(password);

    if (passwordError) {
        return {
            error: passwordError,
            messageId: createMessageId(),
        };
    }
    if (password !== confirmPassword) {
        return {
            error: "Passwords do not match.",
            messageId: createMessageId(),
        };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${getBaseUrl()}/auth/callback`,
            data: {
                full_name: fullName,
                display_name: fullName,
                phone: phone,
            },
        },
    });

    if (error) {
        return {
            error: getFriendlyAuthError(error.message),
            messageId: createMessageId(),
        };
    }

    return {
        success:
            "Account created. Please check your email to confirm your account before signing in.",
        messageId: createMessageId(),
    };
}

export async function sendPasswordReset(
    _prevState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    const email = String(formData.get("email") || "")
        .trim()
        .toLowerCase();

    const genericSuccessMessage =
        "If an account exists for that email, we'll send a password reset link.";

    if (!email || !isValidEmail(email)) {
        return {
            error: "Please enter a valid email address.",
            messageId: createMessageId(),
        };
    }

    try {
        const adminSupabase = createAdminClient();

        const { data: profile, error: profileError } = await adminSupabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (profileError) {
            console.error("[password-reset] Profile lookup failed", {
                email,
                error: profileError.message,
            });

            return {
                success: genericSuccessMessage,
                messageId: createMessageId(),
            };
        }

        if (!profile) {
            console.info("[password-reset] Reset requested for unknown email", {
                email,
            });

            return {
                success: genericSuccessMessage,
                messageId: createMessageId(),
            };
        }

        const supabase = await createClient();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${getBaseUrl()}/auth/callback?next=/reset-password`,
        });

        if (error) {
            console.error("[password-reset] Supabase reset email failed", {
                email,
                error: error.message,
            });

            return {
                success: genericSuccessMessage,
                messageId: createMessageId(),
            };
        }

        console.info("[password-reset] Reset email requested", {
            email,
            profileId: profile.id,
        });

        return {
            success: genericSuccessMessage,
            messageId: createMessageId(),
        };
    } catch (error) {
        console.error("[password-reset] Unexpected reset error", {
            email,
            error,
        });

        return {
            success: genericSuccessMessage,
            messageId: createMessageId(),
        };
    }
}

export async function updatePassword(
    _prevState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!password || !confirmPassword) {
        return {
            error: "Please fill in both password fields.",
            messageId: createMessageId(),
        };
    }

    if (password !== confirmPassword) {
        return {
            error: "Passwords do not match.",
            messageId: createMessageId(),
        };
    }

    const passwordError = getPasswordErrorMessage(password);

    if (passwordError) {
        return {
            error: passwordError,
            messageId: createMessageId(),
        };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        password,
    });

    if (error) {
        return {
            error: getFriendlyAuthError(error.message),
            messageId: createMessageId(),
        };
    }

    redirect(routes.dashboard);
}

export async function signOut() {
    const supabase = await createClient();

    await supabase.auth.signOut();

    redirect(routes.home);
}
