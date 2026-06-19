"use client";

import { useEffect, useState } from "react";
import { copyTextToClipboard } from "@/lib/utils/clipboard";

export function useClipboardCopy() {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setCopied(false);
        }, 1800);

        return () => window.clearTimeout(timeout);
    }, [copied]);

    async function copy(text: string) {
        const success = await copyTextToClipboard(text);

        if (success) {
            setCopied(true);
        }

        return success;
    }

    return {
        copied,
        copy,
    };
}
