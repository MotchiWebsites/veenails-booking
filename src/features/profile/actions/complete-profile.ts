"use server";

import { redirect } from "next/navigation";

import { routes } from "@/constants/routes";
import { requireUser } from "@/features/auth/guards/require-user";
import { normalizeNorthAmericanPhone } from "@/features/auth/validation/phone";
import { LEGAL_DOCUMENT_VERSION } from "@/features/profile/onboarding/config";
import {
    normalizeInstagramHandle,
    parsePreferredContactMethod,
    validateContactPreference,
    validateDisplayName,
    validateInstagramHandle,
    validateProfilePhone,
} from "@/features/profile/validation/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CompleteProfileActionState = {
    error?: string;
    messageId?: string;
};

function createMessageId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function completeProfile(
    _previousState: CompleteProfileActionState,
    formData: FormData,
): Promise<CompleteProfileActionState> {
    const displayName = String(formData.get("displayName") || "").trim();
    const rawPhone = String(formData.get("phone") || "").trim();
    const rawInstagramHandle = String(
        formData.get("instagramHandle") || "",
    ).trim();
    const instagramHandle = normalizeInstagramHandle(rawInstagramHandle);
    const preferredContactMethod = parsePreferredContactMethod(
        String(formData.get("preferredContactMethod") || "email"),
    );
    const acceptedLegal = formData.get("acceptedLegal") === "on";

    const validationError =
        validateDisplayName(displayName) ||
        validateProfilePhone(rawPhone) ||
        validateInstagramHandle(rawInstagramHandle) ||
        validateContactPreference({
            preferredContactMethod,
            phone: rawPhone
                ? normalizeNorthAmericanPhone(rawPhone)
                : null,
            instagramHandle,
        });

    if (validationError) {
        return {
            error: validationError,
            messageId: createMessageId(),
        };
    }

    if (!acceptedLegal) {
        return {
            error: "Please accept the Terms of Service and Privacy Policy to continue.",
            messageId: createMessageId(),
        };
    }

    const user = await requireUser();
    const completedAt = new Date().toISOString();

    try {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from("profiles")
            .update({
                display_name: displayName,
                phone: rawPhone
                    ? normalizeNorthAmericanPhone(rawPhone)
                    : null,
                instagram_handle: instagramHandle,
                preferred_contact_method: preferredContactMethod ?? "email",
                profile_completed_at: completedAt,
                terms_accepted_at: completedAt,
                privacy_accepted_at: completedAt,
                legal_version: LEGAL_DOCUMENT_VERSION,
                updated_at: completedAt,
            })
            .eq("id", user.id)
            .select("id")
            .single();

        if (error || !data) {
            console.error("[profile-onboarding] Completion failed", {
                userId: user.id,
                code: error?.code,
                message: error?.message,
            });
            return {
                error: "We couldn’t save your profile. Please try again. If it continues, share code PROFILE-SETUP.",
                messageId: createMessageId(),
            };
        }

        const supabase = await createClient();
        const { error: metadataError } = await supabase.auth.updateUser({
            data: {
                display_name: displayName,
                full_name: displayName,
                name: displayName,
            },
        });

        if (metadataError) {
            // The database trigger is the source-of-truth safeguard. Keep this
            // explicit Auth update so the active session receives fresh metadata.
            console.warn("[profile-onboarding] Auth name refresh failed", {
                userId: user.id,
                code: metadataError.code,
                message: metadataError.message,
            });
        }
    } catch (error) {
        console.error("[profile-onboarding] Unexpected completion failure", {
            userId: user.id,
            error,
        });
        return {
            error: "We couldn’t save your profile. Please try again. If it continues, share code PROFILE-SETUP.",
            messageId: createMessageId(),
        };
    }

    redirect(routes.dashboard);
}
