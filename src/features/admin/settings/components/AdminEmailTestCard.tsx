"use client";

import { useActionState } from "react";
import {
    sendTestEmailAction,
    type TestEmailState,
} from "@/features/admin/settings/actions/test-email";

const initialState: TestEmailState = {
    error: "",
    success: "",
    messageId: "",
};

export default function AdminEmailTestCard() {
    const [state, action, pending] = useActionState(
        sendTestEmailAction,
        initialState,
    );

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-foreground">
                Transactional email diagnostics
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Send a configuration test to the email on your admin profile.
                The result is recorded in notification logs; API keys and raw
                provider errors are never shown here.
            </p>
            <form action={action} className="mt-5">
                <button
                    type="submit"
                    className="btn-secondary"
                    disabled={pending}
                >
                    {pending ? "Sending test…" : "Send test email"}
                </button>
            </form>
            {state.success ? (
                <p
                    key={state.messageId}
                    className="mt-4 rounded-2xl bg-background p-4 text-sm text-foreground"
                >
                    {state.success}
                </p>
            ) : null}
            {state.error ? (
                <p
                    key={state.messageId}
                    className="mt-4 rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted"
                >
                    {state.error}
                </p>
            ) : null}
        </section>
    );
}
