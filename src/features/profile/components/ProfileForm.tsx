"use client";

import { useActionState, useEffect, useState } from "react";
import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { updateProfile } from "@/features/profile/actions/profile";
import { CiHeart } from "react-icons/ci";

const initialState = {
    error: "",
    success: "",
    messageId: "",
};

export default function ProfileForm({
    displayName,
    phone,
    createdAt,
}: {
    displayName: string;
    phone: string | null;
    createdAt?: string | null;
}) {
    const { error, success } = useToast();

    const [nameValue, setNameValue] = useState(displayName);

    const formatPhone = (val: string | null) => {
        if (!val) return "";
        const digits = val.replace(/\D/g, "").slice(0, 10);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6)
            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    };

    const [phoneValue, setPhoneValue] = useState(formatPhone(phone));

    const [state, formAction, pending] = useActionState(
        updateProfile,
        initialState,
    );

    const canSubmit = nameValue.trim().length > 0;

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
                    changes. You can update your display name and phone number
                    here.
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
                    <FormField
                        id="displayName"
                        name="displayName"
                        label="Display name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="Your name"
                        value={nameValue}
                        onValueChange={setNameValue}
                        enterKeyHint="next"
                        enterBehavior="next"
                    />

                    <FormField
                        id="phone"
                        name="phone"
                        label="Phone number"
                        type="tel"
                        autoComplete="tel"
                        required={false}
                        placeholder="(416) 123-4567"
                        inputMode="tel"
                        value={phoneValue}
                        onValueChange={(v: string) => setPhoneValue(formatPhone(v))}
                        enterKeyHint="done"
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
