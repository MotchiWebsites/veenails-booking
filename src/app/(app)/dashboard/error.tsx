"use client";

import { useEffect } from "react";
import AppErrorState from "@/components/shared/feedback/AppErrorState";

export default function DashboardErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[dashboard:error-boundary]", {
            message: error.message,
            digest: error.digest,
        });
    }, [error]);

    return (
        <AppErrorState
            title="We couldn't load your dashboard"
            description="Please try again. If this keeps happening, head back to your profile and we'll keep the rest of your account available."
            retryLabel="Try Again"
            secondaryHref="/profile"
            secondaryLabel="Go to Profile"
            onRetry={reset}
        />
    );
}
