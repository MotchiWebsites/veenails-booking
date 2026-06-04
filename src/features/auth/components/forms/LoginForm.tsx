"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { signInWithPassword } from "@/features/auth/actions/auth";
import { routes } from "@/constants/routes";

import AppForm from "@/components/form/AppForm";
import FormField from "@/components/form/FormField";
import GoogleSignInButton from "@/features/auth/components/GoogleSignInButton";
import { useToast } from "@/components/toast/ToastProvider";

const initialState = {
    error: "",
    success: "",
    messageId: "",
};

export default function LoginForm() {
    const { error } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [state, formAction, pending] = useActionState(
        signInWithPassword,
        initialState,
    );

    useEffect(() => {
        if (state.error && state.messageId) {
            error(state.error, "Sign in failed");
        }
    }, [error, state.error, state.messageId]);

    return (
        <div className="space-y-5">
            <GoogleSignInButton />

            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted">
                    or sign in with email
                </span>
                <div className="h-px flex-1 bg-border" />
            </div>

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
                    enterKeyHint="next"
                    enterBehavior="next"
                />

                <FormField
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onValueChange={setPassword}
                    enterKeyHint="done"
                    labelAction={
                        <Link
                            href={routes.forgotPassword}
                            className="link-muted text-xs font-medium"
                        >
                            Forgot password?
                        </Link>
                    }
                />

                <button
                    type="submit"
                    disabled={pending || Boolean(state.success) || !email || !password}
                    className="btn-primary w-full"
                >
                    {pending ? "Signing in..." : "Sign In"}
                </button>
            </AppForm>
        </div>
    );
}
