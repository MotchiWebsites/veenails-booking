"use client";

import { useActionState, useEffect, useState } from "react";
import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { isValidEmail } from "@/features/auth/validation/email";
import { changeEmail } from "@/features/profile/actions/profile";

const initialState = { error: "", success: "", messageId: "" };

export default function EmailChangeForm({
    currentEmail,
}: {
    currentEmail: string;
}) {
    const [emailValue, setEmailValue] = useState("");

    const [state, formAction, pending] = useActionState(
        changeEmail,
        initialState,
    );
    const { error, success } = useToast();

    const emailValid = isValidEmail(emailValue);
    const canSubmit =
        emailValid &&
        emailValue.trim().toLowerCase() !== currentEmail.toLowerCase();

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) error(state.error, "Could not change email");
        if (state.success) success(state.success, "Email change started");
    }, [state, error, success]);

    return (
        <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-dark-green">
                Email address
            </p>
            <h3 className="mt-2 text-lg font-semibold">Change email</h3>
            <p className="mt-2 text-sm text-muted">
                Changing your email will send a confirmation link to your new
                email address.
            </p>

            <div className="mt-4">
                <p className="text-sm font-medium">Current email</p>
                <p className="mt-1 truncate text-sm text-foreground">
                    {currentEmail}
                </p>
            </div>

            <div className="mt-4">
                <AppForm action={formAction}>
                    <FormField
                        id="newEmail"
                        name="newEmail"
                        label="New email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        value={emailValue}
                        onValueChange={setEmailValue}
                        inputMode="email"
                        enterKeyHint="done"
                        error={
                            emailValue && !emailValid
                                ? "Enter a valid email address."
                                : undefined
                        }
                    />

                    <button
                        type="submit"
                        disabled={pending || !canSubmit}
                        className="btn-primary w-full sm:w-auto"
                    >
                        {pending ? "Processing..." : "Change email"}
                    </button>
                </AppForm>
            </div>
        </div>
    );
}
