"use server";

import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidEmail } from "@/features/auth/validation/email";
import {
    getAuthErrorLogDetails,
    getFriendlyAuthError,
} from "@/features/auth/lib/auth-errors";
import { maskEmail } from "@/features/auth/lib/mask-email";

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
    suggestedSignIn?: "email" | "google";
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

    let error;
    let destination: string = routes.dashboard;

    try {
        const supabase = await createClient();
        const result = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        error = result.error;

        if (!error && result.data.user) {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("profile_completed_at")
                .eq("id", result.data.user.id)
                .maybeSingle();

            if (profileError) {
                console.error("[auth-signin] Profile status lookup failed", {
                    code: profileError.code,
                    message: profileError.message,
                });
            } else if (!profile?.profile_completed_at) {
                destination = routes.completeProfile;
            }
        }
    } catch (caughtError) {
        console.error(
            "[auth-signin] Unexpected sign-in failure",
            getAuthErrorLogDetails(caughtError),
        );

        return {
            error: getFriendlyAuthError(caughtError, "AUTH-SIGNIN"),
            messageId: createMessageId(),
        };
    }

    if (error) {
        console.warn(
            "[auth-signin] Sign-in rejected",
            getAuthErrorLogDetails(error),
        );

        return {
            error: getFriendlyAuthError(error, "AUTH-SIGNIN"),
            messageId: createMessageId(),
        };
    }

    redirect(destination);
}

export async function signUpWithPassword(
    _prevState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "")
        .trim()
        .toLowerCase();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

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

    // Check server-side whether the email already has a profile/account.
    try {
        const adminSupabase = createAdminClient();

        const { data: existingProfile, error: profileError } =
            await adminSupabase
                .from("profiles")
                .select("id")
                .eq("email", email)
                .maybeSingle();

        if (profileError) {
            console.error("[signup] profile lookup failed", {
                email: maskEmail(email),
                error: profileError.message,
            });
        }

        if (existingProfile) {
            const {
                data: { user: existingUser },
                error: userLookupError,
            } = await adminSupabase.auth.admin.getUserById(existingProfile.id);

            if (userLookupError) {
                console.error("[auth-signup] Existing user lookup failed", {
                    userId: existingProfile.id,
                    ...getAuthErrorLogDetails(userLookupError),
                });
            }

            const providers = new Set(
                existingUser?.identities?.map((identity) => identity.provider) ??
                    [],
            );
            const metadataProviders = existingUser?.app_metadata.providers;

            if (Array.isArray(metadataProviders)) {
                for (const provider of metadataProviders) {
                    if (typeof provider === "string") {
                        providers.add(provider);
                    }
                }
            }

            if (providers.has("google")) {
                return {
                    error: "This email is already connected to Google. Continue with Google to sign in; your existing profile and bookings will stay connected. (Code: AUTH-USE-GOOGLE)",
                    messageId: createMessageId(),
                    suggestedSignIn: "google",
                };
            }

            return {
                error: "An account with this email already exists. Sign in with your password, or continue with Google. (Code: AUTH-ACCOUNT-EXISTS)",
                messageId: createMessageId(),
                suggestedSignIn: "email",
            };
        }
    } catch (err) {
        console.error("[signup] profile check error", {
            email: maskEmail(email),
            error: getAuthErrorLogDetails(err),
        });
    }

    let signupData;
    let signupError;

    try {
        const supabase = await createClient();
        const result = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${getBaseUrl()}/auth/callback`,
                data: {
                    full_name: fullName,
                    display_name: fullName,
                },
            },
        });

        signupData = result.data;
        signupError = result.error;
    } catch (caughtError) {
        console.error(
            "[auth-signup] Unexpected signup failure",
            getAuthErrorLogDetails(caughtError),
        );

        return {
            error: getFriendlyAuthError(caughtError, "AUTH-SIGNUP"),
            messageId: createMessageId(),
        };
    }

    if (signupError) {
        console.warn(
            "[auth-signup] Signup rejected",
            getAuthErrorLogDetails(signupError),
        );

        return {
            error: getFriendlyAuthError(signupError, "AUTH-SIGNUP"),
            messageId: createMessageId(),
        };
    }

    if (signupData.session) {
        redirect(routes.completeProfile);
    }

    return {
        success:
            "Account created. Check your email to confirm it, then complete your profile.",
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

    const maskedEmail = maskEmail(email);

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
                email: maskedEmail,
                error: profileError.message,
            });

            return {
                success: genericSuccessMessage,
                messageId: createMessageId(),
            };
        }

        if (!profile) {
            console.info("[password-reset] Reset requested for unknown email", {
                email: maskedEmail,
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
                email: maskedEmail,
                error: error.message,
            });

            return {
                success: genericSuccessMessage,
                messageId: createMessageId(),
            };
        }

        console.info("[password-reset] Reset email requested", {
            email: maskedEmail,
            profileId: profile.id,
        });

        return {
            success: genericSuccessMessage,
            messageId: createMessageId(),
        };
    } catch (error) {
        console.error("[password-reset] Unexpected reset error", {
            email: maskedEmail,
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

    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            console.error("[update-password] Supabase error", {
                error: error.message,
            });

            return {
                error: getFriendlyAuthError(error, "AUTH-PASSWORD"),
                messageId: createMessageId(),
            };
        }

        return {
            success: "Password updated. You can now sign in.",
            messageId: createMessageId(),
        };
    } catch (error) {
        console.error("[update-password] Unexpected error", {
            error,
        });

        return {
            error: "Could not update your password. Please try requesting a new reset link.",
            messageId: createMessageId(),
        };
    }
}

export async function signOut() {
    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signOut({ scope: "local" });

        if (error) {
            console.warn(
                "[auth-signout] Sign-out returned an error",
                getAuthErrorLogDetails(error),
            );
        }
    } catch (error) {
        console.error(
            "[auth-signout] Unexpected sign-out failure",
            getAuthErrorLogDetails(error),
        );
    }

    redirect(routes.home);
}
