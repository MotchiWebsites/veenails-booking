"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFriendlyAuthError } from "@/features/auth/lib/auth-errors";
import { maskEmail } from "@/features/auth/lib/mask-email";
import {
    normalizeProfilePhone,
    normalizeInstagramHandle,
    parsePreferredContactMethod,
    validateContactPreference,
    validateDisplayName,
    validateInstagramHandle,
    validateProfileEmail,
    validateProfilePassword,
    validateProfilePhone,
} from "@/features/profile/validation/profile";

export type ProfileActionState = {
    error?: string;
    success?: string;
    messageId?: string;
    // pendingEmail is returned when an email-change flow has been started
    pendingEmail?: string | null;
    // reauthRequired is returned when Supabase requires reauthentication for sensitive ops
    reauthRequired?: boolean;
};

function createMessageId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getBaseUrl() {
    const value =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        "http://localhost:3000";

    if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
    }

    return `https://${value}`;
}

function serializeError(error: unknown) {
    if (!error) {
        return null;
    }

    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
    }

    if (typeof error === "object") {
        return error;
    }

    return {
        message: String(error),
    };
}

function logProfileActionError(
    action: string,
    error: unknown,
    metadata?: Record<string, unknown>,
) {
    console.error(`[profile:${action}]`, {
        ...metadata,
        error: serializeError(error),
    });
}

export async function updateProfile(
    _prevState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const displayName = String(formData.get("displayName") || "").trim();
    const rawPhone = String(formData.get("phone") || "").trim();
    const rawInstagramHandle = String(
        formData.get("instagramHandle") || "",
    ).trim();
    const instagramHandle = normalizeInstagramHandle(rawInstagramHandle);
    const preferredContactMethod = parsePreferredContactMethod(
        String(formData.get("preferredContactMethod") || "email"),
    );

    const nameError = validateDisplayName(displayName);

    if (nameError) {
        return {
            error: nameError,
            messageId: createMessageId(),
        };
    }

    const phoneError = validateProfilePhone(rawPhone);

    if (phoneError) {
        return {
            error: phoneError,
            messageId: createMessageId(),
        };
    }

    const normalizedPhone = normalizeProfilePhone(rawPhone);
    const instagramError = validateInstagramHandle(rawInstagramHandle);

    if (instagramError) {
        return {
            error: instagramError,
            messageId: createMessageId(),
        };
    }

    const contactPreferenceError = validateContactPreference({
        preferredContactMethod,
        phone: normalizedPhone,
        instagramHandle,
    });

    if (contactPreferenceError) {
        return {
            error: contactPreferenceError,
            messageId: createMessageId(),
        };
    }

    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            logProfileActionError("updateProfile.getUser", userError, {
                hasUser: Boolean(user),
            });

            return {
                error: "You must be signed in to update your profile.",
                messageId: createMessageId(),
            };
        }

        const { error } = await supabase
            .from("profiles")
            .update({
                display_name: displayName,
                phone: normalizedPhone,
                instagram_handle: instagramHandle,
                preferred_contact_method: preferredContactMethod ?? "email",
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (error) {
            logProfileActionError("updateProfile.update", error, {
                userId: user.id,
                hasPhone: Boolean(normalizedPhone),
            });

            return {
                error: "Could not update your profile. Please try again.",
                messageId: createMessageId(),
            };
        }

        revalidatePath("/profile");
        revalidatePath("/dashboard");

        return {
            success: "Profile updated.",
            messageId: createMessageId(),
        };
    } catch (error) {
        logProfileActionError("updateProfile.unexpected", error);

        return {
            error: "Could not update your profile. Please try again.",
            messageId: createMessageId(),
        };
    }
}

export async function changeEmail(
    _prevState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const newEmail = String(formData.get("newEmail") || "")
        .trim()
        .toLowerCase();

    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            logProfileActionError("changeEmail.getUser", userError, {
                hasUser: Boolean(user),
            });

            return {
                error: "You must be signed in to update your email.",
                messageId: createMessageId(),
            };
        }

        const emailError = validateProfileEmail(newEmail, user.email);

        if (emailError) {
            return {
                error: emailError,
                messageId: createMessageId(),
            };
        }

        // Start the email-change flow via Supabase Auth. Supabase will send a code or confirmation
        // link depending on the project's email template. For OTP verification in-app, ensure the
        // Supabase email template includes {{ .Token }} (not just {{ .ConfirmationURL }}).
        const { error } = await supabase.auth.updateUser(
            {
                email: newEmail,
            },
            {
                emailRedirectTo: `${getBaseUrl()}/auth/callback?next=/profile`,
            },
        );

        if (error) {
            logProfileActionError("changeEmail.updateUser", error, {
                userId: user.id,
                currentEmail: user.email ? maskEmail(user.email) : null,
                newEmail: maskEmail(newEmail),
            });

            return {
                error: getFriendlyAuthError(error.message),
                messageId: createMessageId(),
            };
        }

        // Return pendingEmail so the client can open an OTP verification modal.
        return {
            success: `Check your new email inbox to confirm this change. Enter the 8-digit code we sent to ${maskEmail(newEmail)}.`,
            pendingEmail: newEmail,
            messageId: createMessageId(),
        };
    } catch (error) {
        logProfileActionError("changeEmail.unexpected", error, {
            newEmail: newEmail ? maskEmail(newEmail) : null,
        });

        return {
            error: "Could not start the email change. Please try again.",
            messageId: createMessageId(),
        };
    }
}

export async function verifyEmailChange(
    _prevState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const currentEmail = String(formData.get("currentEmail") || "")
        .trim()
        .toLowerCase();

    const pendingEmail = String(formData.get("pendingEmail") || "")
        .trim()
        .toLowerCase();

    const currentEmailToken = String(
        formData.get("currentEmailToken") || "",
    ).trim();

    const newEmailToken = String(formData.get("newEmailToken") || "").trim();

    if (
        !currentEmail ||
        !pendingEmail ||
        !currentEmailToken ||
        !newEmailToken
    ) {
        return {
            error: "Please enter both verification codes.",
            messageId: createMessageId(),
        };
    }

    try {
        const supabase = await createClient();

        const currentResult = await supabase.auth.verifyOtp({
            email: currentEmail,
            token: currentEmailToken,
            type: "email_change",
        });

        if (currentResult.error) {
            logProfileActionError(
                "verifyEmailChange.currentEmailToken",
                currentResult.error,
                {
                    currentEmail: maskEmail(currentEmail),
                    pendingEmail: maskEmail(pendingEmail),
                },
            );

            return {
                error: getFriendlyAuthError(currentResult.error.message),
                messageId: createMessageId(),
            };
        }

        const newResult = await supabase.auth.verifyOtp({
            email: pendingEmail,
            token: newEmailToken,
            type: "email_change",
        });

        if (newResult.error) {
            logProfileActionError(
                "verifyEmailChange.newEmailToken",
                newResult.error,
                {
                    currentEmail: maskEmail(currentEmail),
                    pendingEmail: maskEmail(pendingEmail),
                },
            );

            return {
                error: getFriendlyAuthError(newResult.error.message),
                messageId: createMessageId(),
            };
        }

        revalidatePath("/profile");
        revalidatePath("/dashboard");

        return {
            success: "Email updated successfully.",
            messageId: createMessageId(),
        };
    } catch (error) {
        logProfileActionError("verifyEmailChange.unexpected", error, {
            currentEmail: currentEmail ? maskEmail(currentEmail) : null,
            pendingEmail: pendingEmail ? maskEmail(pendingEmail) : null,
        });

        return {
            error: "Could not verify the email change. Please try again.",
            messageId: createMessageId(),
        };
    }
}

export async function resendEmailChange(
    _prevState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const currentEmail = String(formData.get("currentEmail") || "")
        .trim()
        .toLowerCase();

    const pendingEmail = String(formData.get("pendingEmail") || "")
        .trim()
        .toLowerCase();

    if (!currentEmail || !pendingEmail) {
        return {
            error: "Missing email details to resend codes.",
            messageId: createMessageId(),
        };
    }

    try {
        const supabase = await createClient();

        const currentResult = await supabase.auth.resend({
            type: "email_change",
            email: currentEmail,
        });

        if (currentResult.error) {
            logProfileActionError(
                "resendEmailChange.currentEmail",
                currentResult.error,
                {
                    currentEmail: maskEmail(currentEmail),
                    pendingEmail: maskEmail(pendingEmail),
                },
            );

            return {
                error: getFriendlyAuthError(currentResult.error.message),
                messageId: createMessageId(),
            };
        }

        const newResult = await supabase.auth.resend({
            type: "email_change",
            email: pendingEmail,
        });

        if (newResult.error) {
            logProfileActionError(
                "resendEmailChange.pendingEmail",
                newResult.error,
                {
                    currentEmail: maskEmail(currentEmail),
                    pendingEmail: maskEmail(pendingEmail),
                },
            );

            return {
                error: getFriendlyAuthError(newResult.error.message),
                messageId: createMessageId(),
            };
        }

        return {
            success: "Verification codes resent.",
            pendingEmail,
            messageId: createMessageId(),
        };
    } catch (error) {
        logProfileActionError("resendEmailChange.unexpected", error, {
            currentEmail: currentEmail ? maskEmail(currentEmail) : null,
            pendingEmail: pendingEmail ? maskEmail(pendingEmail) : null,
        });

        return {
            error: "Could not resend the codes. Please try again later.",
            messageId: createMessageId(),
        };
    }
}

export async function changePassword(
    _prevState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
        return {
            error: "Please fill in all password fields.",
            messageId: createMessageId(),
        };
    }

    if (newPassword !== confirmPassword) {
        return {
            error: "Passwords do not match.",
            messageId: createMessageId(),
        };
    }

    if (currentPassword === newPassword) {
        return {
            error: "Your new password must be different from your current password.",
            messageId: createMessageId(),
        };
    }

    const passwordError = validateProfilePassword(newPassword);

    if (passwordError) {
        return {
            error: passwordError,
            messageId: createMessageId(),
        };
    }

    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            logProfileActionError("changePassword.getUser", userError, {
                hasUser: Boolean(user),
            });

            return {
                error: "You must be signed in to update your password.",
                messageId: createMessageId(),
            };
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
            current_password: currentPassword,
        });

        if (error) {
            logProfileActionError("changePassword.updateUser", error, {
                userId: user.id,
                email: user.email ? maskEmail(user.email) : null,
            });

            return {
                error: getFriendlyAuthError(error.message),
                messageId: createMessageId(),
            };
        }

        revalidatePath("/profile");

        return {
            success: "Password updated.",
            messageId: createMessageId(),
        };
    } catch (error) {
        logProfileActionError("changePassword.unexpected", error);

        return {
            error: "Could not update your password. Please try again.",
            messageId: createMessageId(),
        };
    }
}

export async function requestPasswordReauth(): Promise<ProfileActionState> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            logProfileActionError("requestPasswordReauth.getUser", userError, {
                hasUser: Boolean(user),
            });

            return {
                error: "You must be signed in to update your password.",
                messageId: createMessageId(),
            };
        }

        const { error } = await supabase.auth.reauthenticate();

        if (error) {
            logProfileActionError(
                "requestPasswordReauth.reauthenticate",
                error,
                {
                    userId: user.id,
                    email: user.email ? maskEmail(user.email) : null,
                },
            );

            return {
                error: getFriendlyAuthError(error.message),
                messageId: createMessageId(),
            };
        }

        return {
            success: `A verification code was sent to ${user.email ? maskEmail(user.email) : "your email"}. Enter it to confirm your password change.`,
            reauthRequired: true,
            messageId: createMessageId(),
        };
    } catch (error) {
        logProfileActionError("requestPasswordReauth.unexpected", error);

        return {
            error: "Could not start reauthentication. Please try again.",
            messageId: createMessageId(),
        };
    }
}

export async function confirmPasswordChange(
    _prevState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const newPassword = String(formData.get("newPassword") || "");
    const nonce = String(formData.get("nonce") || "");

    if (!newPassword || !nonce) {
        return {
            error: "Missing password or verification code.",
            messageId: createMessageId(),
        };
    }

    const passwordError = validateProfilePassword(newPassword);

    if (passwordError) {
        return {
            error: passwordError,
            messageId: createMessageId(),
        };
    }

    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            logProfileActionError("confirmPasswordChange.getUser", userError, {
                hasUser: Boolean(user),
            });

            return {
                error: "You must be signed in to update your password.",
                messageId: createMessageId(),
            };
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
            nonce,
        });

        if (error) {
            logProfileActionError("confirmPasswordChange.updateUser", error, {
                userId: user.id,
                email: user.email ? maskEmail(user.email) : null,
            });

            return {
                error: getFriendlyAuthError(error.message),
                messageId: createMessageId(),
            };
        }

        revalidatePath("/profile");

        return {
            success: "Password updated.",
            messageId: createMessageId(),
        };
    } catch (error) {
        logProfileActionError("confirmPasswordChange.unexpected", error);

        return {
            error: "Could not update your password. Please try again.",
            messageId: createMessageId(),
        };
    }
}
