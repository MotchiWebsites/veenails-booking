"use client";

import { useActionState, useEffect, useState } from "react";
import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
import { useToast } from "@/components/shared/toast/ToastProvider";
import ModalShell from "@/components/shared/ui/ModalShell";
import {
    confirmPasswordChange,
    requestPasswordReauth,
} from "@/features/profile/actions/profile";

const REAUTH_CODE_LENGTH = 8;
const REAUTH_COOLDOWN_SECONDS = 60;

export default function PasswordReauthenticationModal({
    maskedEmail,
    newPassword,
    onClose,
    onPasswordUpdated,
}: {
    maskedEmail?: string | null;
    newPassword: string;
    onClose: () => void;
    onPasswordUpdated: () => void;
}) {
    const { success, error } = useToast();

    const [nonce, setNonce] = useState("");
    const [cooldown, setCooldown] = useState(0);

    const [requestState, requestAction, requestPending] = useActionState(
        requestPasswordReauth,
        { error: "", success: "", messageId: "" },
    );

    const [confirmState, confirmAction, confirmPending] = useActionState(
        confirmPasswordChange,
        { error: "", success: "", messageId: "" },
    );

    const canSendCode = !requestPending && cooldown <= 0;
    const canConfirm =
        nonce.trim().length === REAUTH_CODE_LENGTH && !confirmPending;

    const handleSendCode = () => {
        if (!canSendCode) return;

        setCooldown(REAUTH_COOLDOWN_SECONDS);
        requestAction(new FormData());
    };

    const handleNonceChange = (value: string) => {
        setNonce(value.replace(/\D/g, "").slice(0, REAUTH_CODE_LENGTH));
    };

    useEffect(() => {
        if (!requestState.messageId) return;

        if (requestState.error) {
            error(requestState.error, "Could not send code");
        }

        if (requestState.success) {
            success(requestState.success, "Verification code sent");
        }
    }, [
        requestState.messageId,
        requestState.error,
        requestState.success,
        error,
        success,
    ]);

    useEffect(() => {
        if (!confirmState.messageId) return;

        if (confirmState.error) {
            error(confirmState.error, "Could not update password");
        }

        if (confirmState.success) {
            success(confirmState.success, "Password updated");
            onPasswordUpdated();
        }
    }, [
        confirmState.messageId,
        confirmState.error,
        confirmState.success,
        error,
        success,
        onPasswordUpdated,
    ]);

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = window.setInterval(() => {
            setCooldown((current) => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [cooldown]);

    return (
        <ModalShell
            title="Verify it's you"
            description={`Enter the verification code sent to ${
                maskedEmail ?? "your email"
            } to update your password.`}
            onClose={onClose}
        >
            <div className="mb-4">
                <button
                    type="button"
                    className="btn-secondary w-full sm:w-auto"
                    onClick={handleSendCode}
                    disabled={!canSendCode}
                >
                    {requestPending
                        ? "Sending..."
                        : cooldown > 0
                          ? `Resend (${cooldown}s)`
                          : "Send code"}
                </button>
            </div>

            <AppForm action={confirmAction} className="flex flex-col gap-3">
                <input type="hidden" name="newPassword" value={newPassword} />

                <FormField
                    id="nonce"
                    name="nonce"
                    label="Verification code"
                    type="text"
                    required
                    value={nonce}
                    onValueChange={handleNonceChange}
                    placeholder="12345678"
                    inputMode="numeric"
                    enterKeyHint="done"
                />

                <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                    <button
                        type="submit"
                        disabled={!canConfirm}
                        className="btn-primary w-full sm:flex-1"
                    >
                        {confirmPending ? "Updating..." : "Verify & Update"}
                    </button>

                    <button
                        onClick={onClose}
                        type="button"
                        className="text-sm text-muted"
                    >
                        Cancel
                    </button>
                </div>
            </AppForm>
        </ModalShell>
    );
}
