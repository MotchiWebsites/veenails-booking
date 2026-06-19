"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { copyTextToClipboard } from "@/lib/utils/clipboard";

const SECTION_LABELS = new Set(["Booking details", "Client details"]);

function formatMessageForDisplay(message: string) {
    const lines = message.split("\n");

    return lines.map((line, index) => {
        const key = `${index}-${line}`;

        if (!line.trim()) {
            return <div key={key} className="h-3" />;
        }

        if (SECTION_LABELS.has(line)) {
            return (
                <p
                    key={key}
                    className="pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                >
                    {line}
                </p>
            );
        }

        if (!line.includes(":")) {
            return (
                <p key={key} className="text-sm leading-relaxed text-foreground">
                    {line}
                </p>
            );
        }

        const [label, ...valueParts] = line.split(":");
        const value = valueParts.join(":").trim();

        return (
            <div key={key} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <p className="text-sm font-medium text-muted">{label}</p>
                <p className="wrap-break-word text-sm font-semibold text-foreground">
                    {value}
                </p>
            </div>
        );
    });
}

export default function InspoMessageCopyCard({
    message,
    disabled,
    onCopy,
}: {
    message: string;
    disabled?: boolean;
    onCopy: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const displayMessage = useMemo(
        () => formatMessageForDisplay(message),
        [message],
    );

    useEffect(() => {
        if (!copied) return;

        const timeout = window.setTimeout(() => {
            setCopied(false);
        }, 1800);

        return () => window.clearTimeout(timeout);
    }, [copied]);

    async function handleCopy() {
        const success = await copyTextToClipboard(message);

        if (!success) return;

        setCopied(true);
        onCopy();
    }

    return (
        <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-col gap-3 md:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                        Message to send first
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted md:max-w-2/3">
                        Copy this message, send it in the Instagram chat, then
                        send your inspo photos after it.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={disabled || !message}
                    className="btn-secondary w-full md:max-w-1/3 inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FiCopy className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-medium">
                        {copied ? "Copied" : "Copy message"}
                    </span>
                </button>
            </div>
            <div className="mt-4 rounded-2xl border border-border/50 bg-surface p-4">
                <div className="space-y-2">{displayMessage}</div>
            </div>
        </div>
    );
}
