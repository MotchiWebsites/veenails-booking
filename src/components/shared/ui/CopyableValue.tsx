"use client";

import { useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { copyTextToClipboard } from "@/lib/utils/clipboard";

export default function CopyableValue({
    label,
    value,
    helperText,
    copyLabel = "Copy",
    copiedLabel = "Copied",
    className = "",
    disabled = false,
    onCopySuccess,
    onCopyFailure,
}: {
    label: string;
    value: string;
    helperText?: string;
    copyLabel?: string;
    copiedLabel?: string;
    className?: string;
    disabled?: boolean;
    onCopySuccess?: () => void;
    onCopyFailure?: () => void;
}) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const timeout = window.setTimeout(() => {
            setCopied(false);
        }, 1800);

        return () => window.clearTimeout(timeout);
    }, [copied]);

    async function handleCopy() {
        const success = await copyTextToClipboard(value);

        if (success) {
            setCopied(true);
            onCopySuccess?.();
            return;
        }

        onCopyFailure?.();
    }

    return (
        <div
            className={[
                "rounded-3xl border border-border/60 bg-background p-4",
                className,
            ].join(" ")}
        >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {label}
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="select-text break-words text-base font-semibold text-foreground">
                    {value}
                </p>
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={disabled || !value}
                    aria-label={`${copyLabel} ${label}`}
                    className="btn-secondary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FiCopy className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-medium">
                        {copied ? copiedLabel : copyLabel}
                    </span>
                </button>
            </div>
            {helperText ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
}
