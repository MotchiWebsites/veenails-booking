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

function ForgotPasswordFormContent({
    initialAuthError,
    onReset,
}: {
    initialAuthError?: string;
    onReset: () => void;
}) {
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

    useEffect(() => {
        if (initialAuthError === "expired") {
            error(
                "This password reset link is invalid, expired, or already used. Request a new link below.",
                "Reset link expired",
                "AUTH-RESET-EXPIRED",
            );
        } else if (initialAuthError === "missing") {
            error(
                "This password reset link is incomplete. Request a new link below.",
                "Invalid reset link",
                "AUTH-RESET-MISSING",
            );
        } else if (initialAuthError) {
            error(
                "We couldn’t verify that password reset link. Request a new link below.",
                "Reset link failed",
                "AUTH-RESET",
            );
        }
    }, [error, initialAuthError]);

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
                secondaryActionLabel="Edit Email"
                secondaryActionOnClick={onReset}
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

export default function ForgotPasswordForm({
    initialAuthError,
}: {
    initialAuthError?: string;
}) {
    const [formVersion, setFormVersion] = useState(0);

    return (
        <ForgotPasswordFormContent
            key={formVersion}
            initialAuthError={initialAuthError}
            onReset={() => setFormVersion((version) => version + 1)}
        />
    );
}
