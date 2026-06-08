"use client";

import { useEffect } from "react";
import AppErrorState from "@/components/shared/feedback/AppErrorState";

export default function BookingErrorPage({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    useEffect(() => {
        console.error("[bookings:error-boundary]", {
            message: error.message,
            digest: error.digest,
        });
    }, [error]);

    return (
        <AppErrorState
            title="We couldn't load your bookings"
            description="Please try again. If this keeps happening, return to your dashboard and try again later."
            secondaryHref="/dashboard"
            secondaryLabel="Go to Dashboard"
            retryLabel="Try Again"
            onRetry={unstable_retry}
        />
    );
}
