"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { sendPasswordReset } from "@/features/auth/actions/auth";
import { useToast } from "@/components/toast/ToastProvider";
import AppForm from "@/components/form/AppForm";
import FormField from "@/components/form/FormField";
import { isValidEmail } from "@/features/auth/validation/email";

const initialState = {
    error: "",
    success: "",
    messageId: "",
};

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");

    const emailValid = useMemo(() => isValidEmail(email), [email]);
    const canSubmit = emailValid;

    const [state, formAction, pending] = useActionState(
        sendPasswordReset,
        initialState,
    );

    const { error, success } = useToast();

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Could not send reset email");
        }

        if (state.success) {
            success(state.success, "Check your email");
        }
    }, [error, success, state.error, state.messageId, state.success]);

    return (
        <AppForm action={formAction}>
            <FormField
                id="email"
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onValueChange={setEmail}
                inputMode="email"
                enterKeyHint="done"
                error={
                    email.length > 0 && !emailValid
                        ? "Enter a valid email address."
                        : undefined
                }
            />

            <button
                type="submit"
                disabled={pending || Boolean(state.success) || !canSubmit}
                className="btn-primary w-full"
            >
                {pending ? "Sending..." : "Send Reset Link"}
            </button>

            {!canSubmit ? (
                <p className="text-center text-xs leading-relaxed text-muted">
                    Enter the email address used for your booking account.
                </p>
            ) : null}
        </AppForm>
    );
}
