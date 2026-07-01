"use client";

import { useActionState, useEffect, useState } from "react";

import AppForm from "@/components/shared/form/AppForm";
import FormCheckbox from "@/components/shared/form/FormCheckbox";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { formatNorthAmericanPhone } from "@/features/auth/validation/phone";
import {
    completeProfile,
    type CompleteProfileActionState,
} from "@/features/profile/actions/complete-profile";
import ProfileDetailsFields, {
    isProfileDetailsValid,
} from "@/features/profile/components/ProfileDetailsFields";
import type { PreferredContactMethod } from "@/features/profile/validation/profile";

const initialState: CompleteProfileActionState = {};

type CompleteProfileFormProps = {
    displayName: string;
    phone: string | null;
    instagramHandle: string | null;
    preferredContactMethod: PreferredContactMethod;
};

export default function CompleteProfileForm({
    displayName,
    phone,
    instagramHandle,
    preferredContactMethod,
}: CompleteProfileFormProps) {
    const { error: showError } = useToast();
    const [nameValue, setNameValue] = useState(displayName);
    const [phoneValue, setPhoneValue] = useState(
        formatNorthAmericanPhone(phone ?? ""),
    );
    const [instagramValue, setInstagramValue] = useState(
        instagramHandle ?? "",
    );
    const [contactMethod, setContactMethod] =
        useState<PreferredContactMethod>(preferredContactMethod);
    const [acceptedLegal, setAcceptedLegal] = useState(false);
    const [state, formAction, pending] = useActionState(
        completeProfile,
        initialState,
    );

    const canSubmit =
        acceptedLegal &&
        isProfileDetailsValid({
            displayName: nameValue,
            phone: phoneValue,
            instagramHandle: instagramValue,
            preferredContactMethod: contactMethod,
        });

    useEffect(() => {
        if (state.error && state.messageId) {
            showError(state.error, "Could not complete profile");
        }
    }, [showError, state.error, state.messageId]);

    return (
        <AppForm action={formAction}>
            <ProfileDetailsFields
                displayName={nameValue}
                onDisplayNameChange={setNameValue}
                phone={phoneValue}
                onPhoneChange={setPhoneValue}
                instagramHandle={instagramValue}
                onInstagramHandleChange={setInstagramValue}
                preferredContactMethod={contactMethod}
                onPreferredContactMethodChange={setContactMethod}
            />

            <FormCheckbox
                id="acceptedLegal"
                name="acceptedLegal"
                checked={acceptedLegal}
                onCheckedChange={setAcceptedLegal}
                required
            />

            <button
                type="submit"
                disabled={pending || !canSubmit}
                className="btn-primary w-full"
            >
                {pending ? "Saving profile..." : "Complete Profile"}
            </button>

            {!canSubmit ? (
                <p className="text-center text-xs leading-relaxed text-muted">
                    Complete the required fields and agreements to continue.
                </p>
            ) : null}
        </AppForm>
    );
}
