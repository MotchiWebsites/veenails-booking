"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
import PasswordRequirements from "@/components/shared/form/PasswordRequirements";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    changePassword,
    type ProfileActionState,
} from "@/features/profile/actions/profile";
import {
    isValidPassword,
    validateProfilePassword,
} from "@/features/profile/validation/profile";

const initialState: ProfileActionState = {
    error: "",
    success: "",
    messageId: "",
};

export default function PasswordChangeForm() {
    const { error, success } = useToast();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formOpen, setFormOpen] = useState(false);

    const handlePasswordUpdated = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setFormOpen(false);
    };

    const [state, formAction, pending] = useActionState(
        async (prevState: ProfileActionState, formData: FormData) => {
            const result = await changePassword(prevState, formData);

            if (result.success) {
                handlePasswordUpdated();
            }

            return result;
        },
        initialState,
    );

    const passwordError = useMemo(
        () => validateProfilePassword(newPassword),
        [newPassword],
    );

    const passwordValid = useMemo(
        () => isValidPassword(newPassword),
        [newPassword],
    );

    const passwordsMatch =
        confirmPassword.length > 0 && newPassword === confirmPassword;

    const showMismatch =
        confirmPassword.length > 0 && newPassword !== confirmPassword;

    const sameAsCurrent =
        currentPassword.length > 0 &&
        newPassword.length > 0 &&
        currentPassword === newPassword;

    const canSubmit =
        currentPassword.length > 0 &&
        passwordValid &&
        passwordsMatch &&
        !sameAsCurrent;

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Could not change password");
        }

        if (state.success) {
            success(state.success, "Password updated");
        }
    }, [error, success, state.error, state.messageId, state.success]);

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:items-start">
                <div>
                    <p className="text-sm font-semibold text-dark-green">
                        Password
                    </p>
                    <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                        Account password
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                        Choose a new password for your booking account.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setFormOpen((value) => !value)}
                    className="btn-secondary w-full sm:w-auto"
                >
                    {formOpen ? "Cancel" : "Change Password"}
                </button>
            </div>

            {formOpen ? (
                <div className="mt-6">
                    <AppForm action={formAction}>
                        <FormField
                            id="currentPassword"
                            name="currentPassword"
                            label="Current password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={currentPassword}
                            onValueChange={setCurrentPassword}
                            placeholder="Enter your current password"
                            enterKeyHint="next"
                            enterBehavior="next"
                        />

                        <FormField
                            id="newPassword"
                            name="newPassword"
                            label="New password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={newPassword}
                            onValueChange={setNewPassword}
                            placeholder="Create a secure password"
                            enterKeyHint="next"
                            enterBehavior="next"
                            hintCollapsible={false}
                            hintContent={
                                <PasswordRequirements
                                    password={newPassword}
                                    showStrength
                                />
                            }
                            error={
                                newPassword.length > 0 && passwordError
                                    ? passwordError
                                    : sameAsCurrent
                                      ? "Your new password must be different from your current password."
                                      : undefined
                            }
                        />

                        <FormField
                            id="confirmPassword"
                            name="confirmPassword"
                            label="Confirm new password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirmPassword}
                            onValueChange={setConfirmPassword}
                            placeholder="Re-enter your password"
                            enterKeyHint="done"
                            error={
                                showMismatch
                                    ? "Passwords do not match yet."
                                    : undefined
                            }
                        />

                        <button
                            type="submit"
                            disabled={pending || !canSubmit}
                            className="btn-primary w-full sm:w-auto"
                        >
                            {pending ? "Updating..." : "Update Password"}
                        </button>
                    </AppForm>
                </div>
            ) : null}
        </section>
    );
}
