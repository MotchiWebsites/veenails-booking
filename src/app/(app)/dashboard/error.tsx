"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiAlertTriangle } from "react-icons/fi";

export default function DashboardErrorPage({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    useEffect(() => {
        console.error("[dashboard:error-boundary]", {
            message: error.message,
            digest: error.digest,
        });
    }, [error]);

    return (
        <div className="flex items-center justify-center p-5 my-auto sm:p-6">
            <div className="w-full max-w-md rounded-3xl border border-border/60 bg-surface p-6 text-center shadow-sm sm:p-8">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full">
                        <Image
                            src="/logo.png"
                            alt="Vee's Nail Studio"
                            fill
                            sizes="48px"
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>

                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-pink-main/10 text-pink-main">
                    <FiAlertTriangle
                        className="h-8 w-8"
                        aria-hidden="true"
                    />
                </div>

                <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                    We couldn&apos;t load your dashboard
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    Please try again. If this keeps happening, head back to your
                    profile and we&apos;ll keep the rest of your account available.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => unstable_retry()}
                        className="btn-primary w-full sm:flex-1"
                    >
                        Try Again
                    </button>

                    <Link href="/profile" className="btn-secondary sm:flex-1">
                        Go to Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}
