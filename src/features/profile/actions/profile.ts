"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeNorthAmericanPhone } from "@/features/auth/validation/phone";
import { isValidEmail } from "@/features/auth/validation/email";
import { isValidPassword } from "@/features/auth/validation/password";

export type ProfileActionState = {
    error?: string;
    success?: string;
    messageId?: string;
};

function createMessageId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function changeEmail(
    _prevState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const newEmail = String(formData.get("newEmail") || "")
        .trim()
        .toLowerCase();

    if (!newEmail || !isValidEmail(newEmail)) {
        return {
            error: "Enter a valid email address.",
            messageId: createMessageId(),
        };
    }

    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            error: "You must be signed in to update your email.",
            messageId: createMessageId(),
        };
    }

    if (user.email && user.email.toLowerCase() === newEmail) {
        return {
            error: "New email must be different from your current email.",
            messageId: createMessageId(),
        };
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
        return {
            error: "Could not start email change. Please try again.",
            messageId: createMessageId(),
        };
    }

    revalidatePath("/profile");

    return {
        success:
            "If required, a confirmation email was sent. Check your inbox.",
        messageId: createMessageId(),
    };
}

export async function changePassword(
    _prevState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const currentPassword = String(
        formData.get("currentPassword") || "",
    ).trim();
    const newPassword = String(formData.get("newPassword") || "").trim();

    if (!currentPassword) {
        return {
            error: "Enter your current password.",
            messageId: createMessageId(),
        };
    }

    if (!newPassword || !isValidPassword(newPassword)) {
        return {
            error: "New password does not meet requirements.",
            messageId: createMessageId(),
        };
    }

    if (currentPassword === newPassword) {
        return {
            error: "Your new password must be different from your current password.",
            messageId: createMessageId(),
        };
    }

    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
        return {
            error: "You must be signed in to update your password.",
            messageId: createMessageId(),
        };
    }

    // Reauthenticate by attempting sign in with the provided current password.
    const signIn = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });

    if (signIn.error) {
        return {
            error: "Current password is incorrect.",
            messageId: createMessageId(),
        };
    }

    const updated = await supabase.auth.updateUser({ password: newPassword });

    if (updated.error) {
        return {
            error: "Could not update password. Please try again.",
            messageId: createMessageId(),
        };
    }

    revalidatePath("/profile");

    return { success: "Password updated.", messageId: createMessageId() };
}

export async function updateProfile(
    _prevState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const displayName = String(formData.get("displayName") || "").trim();
    const rawPhone = String(formData.get("phone") || "").trim();

    if (!displayName) {
        return {
            error: "Please enter your name.",
            messageId: createMessageId(),
        };
    }

    const normalizedPhone = rawPhone
        ? normalizeNorthAmericanPhone(rawPhone)
        : null;

    if (rawPhone && !normalizedPhone) {
        return {
            error: "Please enter a valid 10-digit phone number.",
            messageId: createMessageId(),
        };
    }

    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
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
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
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
}
