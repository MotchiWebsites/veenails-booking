"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import PasswordReauthenticationModal from "@/features/profile/components/PasswordReauthenticationModal";
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

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const handlePasswordUpdated = () => {
        setNewPassword("");
        setConfirmPassword("");
        setFormOpen(false);
        setModalOpen(false);
    };

    const [state, formAction, pending] = useActionState(
        async (prevState: ProfileActionState, formData: FormData) => {
            const result = await changePassword(prevState, formData);

            if (result.success) {
                handlePasswordUpdated();
            }

            if (result.reauthRequired) {
                setModalOpen(true);
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

    const canSubmit = passwordValid && passwordsMatch;

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error && !state.reauthRequired) {
            error(state.error, "Could not change password");
        }

        if (state.reauthRequired) {
            success(
                "Please verify your email to finish updating your password.",
                "Verification required",
            );
        }

        if (state.success) {
            success(state.success, "Password updated");
        }
    }, [
        error,
        success,
        state.error,
        state.success,
        state.messageId,
        state.reauthRequired,
    ]);

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

            {modalOpen ? (
                <PasswordReauthenticationModal
                    maskedEmail={null}
                    newPassword={newPassword}
                    onClose={() => setModalOpen(false)}
                    onPasswordUpdated={handlePasswordUpdated}
                />
            ) : null}
        </section>
    );
}
