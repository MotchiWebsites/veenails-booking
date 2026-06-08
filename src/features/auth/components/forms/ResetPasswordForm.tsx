"use client";

import AuthResultScreen from "@/features/auth/components/AuthResultScreen";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/features/auth/actions/auth";
import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
import PasswordRequirements from "@/components/shared/form/PasswordRequirements";
import { useToast } from "@/components/shared/toast/ToastProvider";
import AppLoadingScreen from "@/components/shared/loading/AppLoadingScreen";
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

    const router = useRouter();

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

            // keep toast visible across navigation, then navigate to login
            const t = setTimeout(() => router.push(routes.login), 400);

            return () => clearTimeout(t);
        }
    }, [error, success, state.error, state.messageId, state.success, router]);

    if (loadingSession) {
        return (
            <div className="w-full">
                <AppLoadingScreen
                    title="Verifying reset link"
                    description="Please wait while we check your password reset session."
                />
            </div>
        );
    }

    if (!sessionAvailable) {
        return (
            <AuthResultScreen
                variant="error"
                title="Reset link expired"
                description={
                    "This reset link is invalid or expired. Request a new reset email to continue."
                }
                primaryActionLabel="Request New Reset Link"
                primaryActionHref={routes.forgotPassword}
                secondaryActionLabel="Back to Sign In"
                secondaryActionHref={routes.login}
            />
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
