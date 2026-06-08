"use client";

import { useEffect, useState, useActionState } from "react";

import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
import { useToast } from "@/components/shared/toast/ToastProvider";
import ModalShell from "@/components/shared/ui/ModalShell";

import {
    resendEmailChange,
    verifyEmailChange,
} from "@/features/profile/actions/profile";

const EMAIL_OTP_LENGTH = 8;
const RESEND_COOLDOWN_SECONDS = 60;

export default function EmailChangeVerificationModal({
    currentEmail,
    pendingEmail,
    onClose,
    onVerified,
}: {
    currentEmail: string;
    pendingEmail: string;
    onClose: () => void;
    onVerified: () => void;
}) {
    const { success, error } = useToast();

    const [currentEmailCode, setCurrentEmailCode] = useState("");
    const [newEmailCode, setNewEmailCode] = useState("");
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

    const [verifyState, verifyAction, verifyPending] = useActionState(
        verifyEmailChange,
        { error: "", success: "", messageId: "" },
    );

    const [resendState, resendAction, resendPending] = useActionState(
        resendEmailChange,
        { error: "", success: "", messageId: "" },
    );

    const canVerify =
        currentEmailCode.trim().length === EMAIL_OTP_LENGTH &&
        newEmailCode.trim().length === EMAIL_OTP_LENGTH &&
        !verifyPending;

    const handleCurrentEmailCodeChange = (value: string) => {
        setCurrentEmailCode(
            value.replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH),
        );
    };

    const handleNewEmailCodeChange = (value: string) => {
        setNewEmailCode(value.replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH));
    };

    const handleResend = () => {
        if (cooldown > 0 || resendPending) return;

        const formData = new FormData();
        formData.set("currentEmail", currentEmail);
        formData.set("pendingEmail", pendingEmail);

        setCooldown(RESEND_COOLDOWN_SECONDS);
        resendAction(formData);
    };

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = window.setInterval(() => {
            setCooldown((current) => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [cooldown]);

    useEffect(() => {
        if (!verifyState.messageId) return;

        if (verifyState.error) {
            error(verifyState.error, "Could not verify codes");
        }

        if (verifyState.success) {
            success(verifyState.success, "Email updated");
            onVerified();
        }
    }, [
        verifyState.messageId,
        verifyState.error,
        verifyState.success,
        error,
        success,
        onVerified,
    ]);

    useEffect(() => {
        if (!resendState.messageId) return;

        if (resendState.error) {
            error(resendState.error, "Could not resend codes");
        }

        if (resendState.success) {
            success(resendState.success, "Codes resent");
        }
    }, [
        resendState.messageId,
        resendState.error,
        resendState.success,
        error,
        success,
    ]);

    return (
        <ModalShell
            title="Verify new email"
            description="For security, enter both verification codes: one sent to your current email and one sent to your new email."
            onClose={onClose}
        >
            <AppForm action={verifyAction} className="flex flex-col gap-3">
                <input type="hidden" name="currentEmail" value={currentEmail} />
                <input type="hidden" name="pendingEmail" value={pendingEmail} />

                <FormField
                    id="currentEmailToken"
                    name="currentEmailToken"
                    label={`Code from current email (${currentEmail})`}
                    type="text"
                    required
                    value={currentEmailCode}
                    onValueChange={handleCurrentEmailCodeChange}
                    placeholder="12345678"
                    inputMode="numeric"
                    enterKeyHint="next"
                    enterBehavior="next"
                />

                <FormField
                    id="newEmailToken"
                    name="newEmailToken"
                    label={`Code from new email (${pendingEmail})`}
                    type="text"
                    required
                    value={newEmailCode}
                    onValueChange={handleNewEmailCodeChange}
                    placeholder="12345678"
                    inputMode="numeric"
                    enterKeyHint="done"
                />

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <button
                        type="submit"
                        disabled={!canVerify}
                        className="btn-primary w-full sm:flex-1"
                    >
                        {verifyPending ? "Verifying..." : "Verify Email Change"}
                    </button>

                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendPending || cooldown > 0}
                        className="btn-secondary w-full sm:w-auto"
                    >
                        {resendPending
                            ? "Sending..."
                            : cooldown > 0
                              ? `Resend (${cooldown}s)`
                              : "Resend"}
                    </button>
                </div>

                <div className="mt-3 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-muted"
                    >
                        Cancel
                    </button>
                </div>
            </AppForm>
        </ModalShell>
    );
}
