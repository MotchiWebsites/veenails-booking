"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import AuthResultScreen from "@/features/auth/components/AuthResultScreen";
import { routes } from "@/constants/routes";
import { sendPasswordReset } from "@/features/auth/actions/auth";
import { useToast } from "@/components/shared/toast/ToastProvider";
import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
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

    if (state.success) {
        return (
            <AuthResultScreen
                variant="info"
                title="Check your email"
                description={
                    "If an account exists for that email, we'll send a password reset link. Follow the link in your email to reset your password."
                }
                primaryActionLabel="Back to Sign In"
                primaryActionHref={routes.login}
                secondaryActionLabel="Try another email"
                secondaryActionHref={routes.forgotPassword}
            />
        );
    }

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
