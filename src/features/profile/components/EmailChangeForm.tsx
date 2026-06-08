"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import EmailChangeVerificationModal from "@/features/profile/components/EmailChangeVerificationModal";
import AppForm from "@/components/shared/form/AppForm";
import FormField from "@/components/shared/form/FormField";
import { useToast } from "@/components/shared/toast/ToastProvider";

import {
    changeEmail,
    type ProfileActionState,
} from "@/features/profile/actions/profile";
import { validateProfileEmail } from "@/features/profile/validation/profile";

const initialState: ProfileActionState = {
    error: "",
    success: "",
    messageId: "",
    pendingEmail: null,
};

export default function EmailChangeForm({
    currentEmail,
}: {
    currentEmail: string;
}) {
    const router = useRouter();
    const { error, success } = useToast();

    const [emailValue, setEmailValue] = useState("");
    const [formOpen, setFormOpen] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);

    const [state, formAction, pending] = useActionState(
        async (prevState: ProfileActionState, formData: FormData) => {
            const result = await changeEmail(prevState, formData);

            if (result.success && result.pendingEmail) {
                setPendingEmail(result.pendingEmail);
                setEmailValue("");
                setFormOpen(false);
                setModalOpen(true);
            }

            return result;
        },
        initialState,
    );

    const emailError = useMemo(
        () => validateProfileEmail(emailValue, currentEmail),
        [emailValue, currentEmail],
    );

    const canSubmit = emailValue.length > 0 && !emailError;

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Could not change email");
        }

        if (state.success) {
            success(state.success, "Email confirmation sent");
        }
    }, [error, success, state.error, state.success, state.messageId]);

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:items-start">
                <div>
                    <p className="text-sm font-semibold text-dark-green">
                        Email address
                    </p>
                    <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                        Account email
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                        Your email is used for sign in, confirmations, and
                        important booking updates.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setFormOpen((value) => !value)}
                    className="btn-secondary w-full sm:w-auto"
                >
                    {formOpen ? "Cancel" : "Change Email"}
                </button>
            </div>

            <div className="mt-5 rounded-2xl border border-border/50 bg-background px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Current email
                </p>
                <p className="mt-1 truncate text-sm font-medium text-foreground sm:text-base">
                    {currentEmail}
                </p>
            </div>

            {formOpen ? (
                <div className="mt-6 flex flex-col">
                    <AppForm action={formAction}>
                        <FormField
                            id="newEmail"
                            name="newEmail"
                            label="New email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@example.com"
                            value={emailValue}
                            onValueChange={setEmailValue}
                            inputMode="email"
                            enterKeyHint="done"
                            error={
                                emailValue.length > 0 && emailError
                                    ? emailError
                                    : undefined
                            }
                        />

                        <p className="text-sm leading-relaxed text-muted">
                            We&apos;ll send verification codes to confirm this
                            change. Your account email will update after
                            verification.
                        </p>

                        <button
                            type="submit"
                            disabled={pending || !canSubmit}
                            className="btn-primary w-full text-center sm:mx-auto sm:block sm:w-auto"
                        >
                            {pending ? "Sending..." : "Send Confirmation"}
                        </button>
                    </AppForm>
                </div>
            ) : null}

            {modalOpen && pendingEmail ? (
                <EmailChangeVerificationModal
                    currentEmail={currentEmail}
                    pendingEmail={pendingEmail}
                    onClose={() => {
                        setModalOpen(false);
                        setPendingEmail(null);
                    }}
                    onVerified={() => {
                        setEmailValue("");
                        setModalOpen(false);
                        setPendingEmail(null);
                        router.refresh();
                    }}
                />
            ) : null}
        </section>
    );
}
