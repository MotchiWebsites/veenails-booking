"use client";

import { useActionState, useEffect, useState } from "react";
import AppForm from "@/components/shared/form/AppForm";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { updateProfile } from "@/features/profile/actions/profile";
import type { PreferredContactMethod } from "@/features/profile/validation/profile";
import { CiHeart } from "react-icons/ci";
import { formatNorthAmericanPhone } from "@/features/auth/validation/phone";
import ProfileDetailsFields, {
    isProfileDetailsValid,
} from "@/features/profile/components/ProfileDetailsFields";

const initialState = {
    error: "",
    success: "",
    messageId: "",
};

export default function ProfileForm({
    displayName,
    phone,
    instagramHandle,
    preferredContactMethod,
    createdAt,
}: {
    displayName: string;
    phone: string | null;
    instagramHandle: string | null;
    preferredContactMethod: PreferredContactMethod;
    createdAt?: string | null;
}) {
    const { error, success } = useToast();

    const [nameValue, setNameValue] = useState(displayName);
    const [phoneValue, setPhoneValue] = useState(
        formatNorthAmericanPhone(phone ?? ""),
    );
    const [instagramValue, setInstagramValue] = useState(instagramHandle ?? "");
    const [preferredContactValue, setPreferredContactValue] =
        useState<PreferredContactMethod>(preferredContactMethod ?? "email");

    const [state, formAction, pending] = useActionState(
        updateProfile,
        initialState,
    );

    const canSubmit = isProfileDetailsValid({
        displayName: nameValue,
        phone: phoneValue,
        instagramHandle: instagramValue,
        preferredContactMethod: preferredContactValue,
    });

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Could not update profile");
        }

        if (state.success) {
            success(state.success, "Saved");
        }
    }, [error, success, state.error, state.messageId, state.success]);

    return (
        <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
            <div>
                <p className="text-sm font-semibold text-dark-green">
                    Profile details
                </p>
                <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                    Update your information
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Keep this information updated so the studio can contact you
                    about appointment requests, confirmations, and booking
                    changes. You can update your display name, phone number,
                    Instagram handle, and preferred contact method here.
                </p>

                {createdAt ? (
                    <div className="mt-3 flex flex-row gap-1 items-center text-sm lg:text-base text-pink-main font-medium">
                        <p className="text-sm lg:text-base">
                            Member since{" "}
                            {new Date(createdAt).toLocaleString(undefined, {
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                        <CiHeart className="h-5 w-5" />
                    </div>
                ) : null}
            </div>

            <div className="mt-6">
                <AppForm action={formAction}>
                    <ProfileDetailsFields
                        displayName={nameValue}
                        onDisplayNameChange={setNameValue}
                        phone={phoneValue}
                        onPhoneChange={setPhoneValue}
                        instagramHandle={instagramValue}
                        onInstagramHandleChange={setInstagramValue}
                        preferredContactMethod={preferredContactValue}
                        onPreferredContactMethodChange={
                            setPreferredContactValue
                        }
                    />

                    <button
                        type="submit"
                        disabled={pending || !canSubmit}
                        className="btn-primary w-full sm:w-auto"
                    >
                        {pending ? "Saving..." : "Save Changes"}
                    </button>
                </AppForm>
            </div>
        </div>
    );
}
