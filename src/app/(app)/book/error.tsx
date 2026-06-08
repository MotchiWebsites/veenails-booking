"use client";

import { useEffect } from "react";
import AppErrorState from "@/components/shared/feedback/AppErrorState";

export default function BookErrorPage({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    useEffect(() => {
        console.error("[bookings:book.error-boundary]", {
            message: error.message,
            digest: error.digest,
        });
    }, [error]);

    return (
        <AppErrorState
            title="We couldn't load booking availability"
            description="Please try again. If this keeps happening, return to your dashboard and try again later."
            secondaryHref="/booking"
            secondaryLabel="Back to My Bookings"
            retryLabel="Try Again"
            onRetry={unstable_retry}
        />
    );
}
