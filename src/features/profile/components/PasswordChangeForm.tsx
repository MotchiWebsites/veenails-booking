"use client";

import { useActionState, useEffect, useState } from "react";
import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
import PasswordRequirements from "@/components/shared/form/PasswordRequirements";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { changePassword } from "@/features/profile/actions/profile";
import {
    isValidPassword,
    getPasswordErrorMessage,
} from "@/features/auth/validation/password";
import Link from "next/link";
import { routes } from "@/constants/routes";

const initialState = { error: "", success: "", messageId: "" };

export default function PasswordChangeForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [state, formAction, pending] = useActionState(
        changePassword,
        initialState,
    );
    const { error, success } = useToast();

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) error(state.error, "Could not change password");
        if (state.success) success(state.success, "Password updated");
    }, [state, error, success]);

    const newValid = isValidPassword(newPassword);
    const confirmMatches = newPassword === confirm;
    const canSubmit =
        currentPassword.length > 0 &&
        newValid &&
        confirmMatches &&
        newPassword !== currentPassword;

    return (
        <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-dark-green">Password</p>
            <h3 className="mt-2 text-lg font-semibold">Change password</h3>
            <p className="mt-2 text-sm text-muted">
                Update your account password. You may need to re-login after
                changing your password.
            </p>

            <div className="mt-4">
                <AppForm action={formAction}>
                    <FormField
                        id="currentPassword"
                        name="currentPassword"
                        label="Current password"
                        type="password"
                        required
                        value={currentPassword}
                        onValueChange={setCurrentPassword}
                        enterKeyHint="next"
                        enterBehavior="next"
                        labelAction={
                            <Link
                                href={routes.forgotPassword}
                                className="link-muted text-xs font-medium"
                            >
                                Forgot password?
                            </Link>
                        }
                    />

                    <FormField
                        id="newPassword"
                        name="newPassword"
                        label="New password"
                        type="password"
                        required
                        value={newPassword}
                        onValueChange={setNewPassword}
                        enterKeyHint="next"
                        enterBehavior="next"
                    />

                    <PasswordRequirements password={newPassword} />

                    {newPassword && !newValid ? (
                        <p className="mt-2 text-xs text-danger">
                            {getPasswordErrorMessage(newPassword) ||
                                "Password does not meet requirements."}
                        </p>
                    ) : null}

                    <FormField
                        id="confirmPassword"
                        name="confirmPassword"
                        label="Confirm new password"
                        type="password"
                        required
                        value={confirm}
                        onValueChange={setConfirm}
                        enterKeyHint="done"
                    />

                    {confirm && !confirmMatches ? (
                        <p className="text-xs text-danger">
                            Passwords do not match.
                        </p>
                    ) : null}

                    {newPassword === currentPassword && confirmMatches ? (
                        <p className="mt-2 text-xs text-muted">
                            Your new password must be different from your
                            current password to update it.
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={pending || !canSubmit}
                        className="btn-primary w-full sm:w-auto"
                    >
                        {pending ? "Updating..." : "Change password"}
                    </button>
                </AppForm>
            </div>
        </div>
    );
}
