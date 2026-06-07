"use client";

import { useEffect } from "react";
import AppErrorState from "@/components/shared/feedback/AppErrorState";

export default function CreditsErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[credits:error-boundary]", {
            message: error.message,
            digest: error.digest,
        });
    }, [error]);

    return (
        <AppErrorState
            title="We couldn't load your credits"
            description="Please try again. If this keeps happening, return to your dashboard and try again later."
            retryLabel="Try Again"
            secondaryHref="/dashboard"
            secondaryLabel="Go to Dashboard"
            onRetry={reset}
        />
    );
}
