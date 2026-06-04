"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { updatePassword } from "@/features/auth/actions/auth";
import AppForm from "@/components/form/AppForm";
import FormField from "@/components/form/FormField";
import PasswordRequirements from "@/components/form/PasswordRequirements";
import { useToast } from "@/components/toast/ToastProvider";
import { isValidPassword } from "@/features/auth/validation/password";
import { createClient } from "@/lib/supabase/client";
import { routes } from "@/constants/routes";

const initialState = {
    error: "",
    success: "",
    messageId: "",
};

export default function ResetPasswordForm() {
    const { error, success } = useToast();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loadingSession, setLoadingSession] = useState(true);
    const [sessionAvailable, setSessionAvailable] = useState(false);

    const passwordValid = useMemo(() => isValidPassword(password), [password]);

    const passwordsMatch =
        confirmPassword.length > 0 && password === confirmPassword;

    const showPasswordMismatch =
        confirmPassword.length > 0 && password !== confirmPassword;

    const canSubmit = passwordValid && passwordsMatch;

    const [state, formAction, pending] = useActionState(
        updatePassword,
        initialState,
    );

    useEffect(() => {
        let mounted = true;

        async function verifyRecoverySession() {
            const supabase = createClient();

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (!mounted) return;

            if (user && !userError) {
                setSessionAvailable(true);
            } else {
                setSessionAvailable(false);
            }

            setLoadingSession(false);
        }

        verifyRecoverySession();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Could not update password");
        }

        if (state.success) {
            success(state.success, "Password updated");
        }
    }, [error, success, state.error, state.messageId, state.success]);

    if (loadingSession) {
        return (
            <p className="text-center text-sm text-muted">
                Verifying reset link…
            </p>
        );
    }

    if (!sessionAvailable) {
        return (
            <div className="space-y-4 text-center">
                <p className="text-sm leading-relaxed text-muted">
                    This reset link is invalid or expired. Please request a new
                    password reset email.
                </p>

                <Link
                    href={routes.forgotPassword}
                    className="btn-secondary w-full"
                >
                    Request New Reset Link
                </Link>
            </div>
        );
    }

    return (
        <AppForm action={formAction}>
            <FormField
                id="password"
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Create a secure password"
                enterKeyHint="next"
                enterBehavior="next"
                value={password}
                onValueChange={setPassword}
                hintTitle="Password requirements"
                hintCollapsible={false}
                hintContent={
                    <PasswordRequirements password={password} showStrength />
                }
            />

            <FormField
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Re-enter your password"
                enterKeyHint="done"
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                error={
                    showPasswordMismatch
                        ? "Passwords do not match yet."
                        : undefined
                }
            />

            <button
                type="submit"
                disabled={pending || !canSubmit}
                className="btn-primary w-full"
            >
                {pending ? "Updating..." : "Update Password"}
            </button>

            {!passwordValid ? (
                <p className="text-center text-xs leading-relaxed text-muted">
                    Complete all password requirements to continue.
                </p>
            ) : null}

            {passwordValid && !passwordsMatch ? (
                <p className="text-center text-xs leading-relaxed text-muted">
                    Re-enter the same password to confirm it.
                </p>
            ) : null}
        </AppForm>
    );
}
