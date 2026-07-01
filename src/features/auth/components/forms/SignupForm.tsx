"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import AuthResultScreen from "@/features/auth/components/AuthResultScreen";
import Link from "next/link";
import { routes } from "@/constants/routes";

import {
    signUpWithPassword,
    type AuthActionState,
} from "@/features/auth/actions/auth";
import { isValidPassword } from "@/features/auth/validation/password";
import { isValidEmail } from "@/features/auth/validation/email";

import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import PasswordRequirements from "@/components/shared/form/PasswordRequirements";
import { useToast } from "@/components/shared/toast/ToastProvider";

const initialState: AuthActionState = {
    error: "",
    success: "",
    messageId: "",
};

export default function SignupForm() {
    const { error, success } = useToast();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const emailValid = useMemo(() => isValidEmail(email), [email]);
    const passwordValid = useMemo(() => isValidPassword(password), [password]);
    const passwordsMatch =
        password === confirmPassword && confirmPassword.length > 0;

    const canSubmit =
        fullName.trim().length > 0 &&
        emailValid &&
        passwordValid &&
        passwordsMatch;

    const [state, formAction, pending] = useActionState(
        signUpWithPassword,
        initialState,
    );

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Could not create account");
        }

        if (state.success) {
            success(state.success, "Check your email");
        }
    }, [error, success, state.error, state.messageId, state.success]);
    if (state.success) {
        return (
            <AuthResultScreen
                variant="success"
                title="Check your email"
                description={
                    "We sent a confirmation link to your email. Open it to verify your account and complete your profile."
                }
                primaryActionLabel="Go to Sign In"
                primaryActionHref={routes.login}
                secondaryActionLabel="Back to Home"
                secondaryActionHref={routes.home}
            />
        );
    }

    return (
        <div className="space-y-5">
            <GoogleSignInButton />

            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted">
                    or create account with email
                </span>
                <div className="h-px flex-1 bg-border" />
            </div>

            <div className="text-left text-sm text-muted">
                All fields marked with <span className="text-pink-main">*</span>{" "}
                are required.
            </div>

            <AppForm action={formAction}>
                <FormField
                    id="fullName"
                    name="fullName"
                    label="Full name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Your name"
                    value={fullName}
                    onValueChange={setFullName}
                    enterKeyHint="next"
                    enterBehavior="next"
                />

                <FormField
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    inputMode="email"
                    value={email}
                    onValueChange={setEmail}
                    enterKeyHint="next"
                    enterBehavior="next"
                    error={
                        email.length > 0 && !emailValid
                            ? "Enter a valid email address."
                            : undefined
                    }
                />

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
                        <PasswordRequirements
                            password={password}
                            showStrength
                        />
                    }
                />

                <FormField
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onValueChange={setConfirmPassword}
                    enterKeyHint="done"
                />

                <button
                    type="submit"
                    disabled={pending || !canSubmit}
                    className="btn-primary w-full"
                >
                    {pending ? "Creating account..." : "Create Account"}
                </button>

                {state.suggestedSignIn ? (
                    <div className="text-center">
                        <p className="text-sm text-muted">
                            {state.suggestedSignIn === "google"
                                ? "This email already uses Google sign-in. Use “Continue with Google” above—your profile and bookings are safe."
                                : "This account already exists. Sign in with your password, or use Google with the same email."}
                        </p>
                        <div className="mt-2">
                            <Link
                                href={routes.login}
                                className="btn-ghost w-full sm:w-auto"
                            >
                                Go to Sign In
                            </Link>
                        </div>
                    </div>
                ) : null}

                {!canSubmit ? (
                    <p className="text-center text-xs leading-relaxed text-muted">
                        Complete the required fields to create your account.
                    </p>
                ) : null}
            </AppForm>
        </div>
    );
}
