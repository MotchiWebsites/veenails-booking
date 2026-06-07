"use client";

import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import { FiAlertTriangle } from "react-icons/fi";

type AppErrorStateProps = {
    title?: string;
    description?: string;
    icon?: IconType;
    retryLabel?: string;
    secondaryHref?: string;
    secondaryLabel?: string;
    onRetry?: () => void;
    showLogo?: boolean;
};

export default function AppErrorState({
    title = "Something went wrong",
    description = "Please try again. If this keeps happening, come back later.",
    icon: Icon = FiAlertTriangle,
    retryLabel = "Try Again",
    secondaryHref = "/dashboard",
    secondaryLabel = "Go to Dashboard",
    onRetry,
    showLogo = true,
}: AppErrorStateProps) {
    return (
        <div className="flex items-center justify-center p-5 my-auto sm:p-6">
            <div className="w-full max-w-md rounded-3xl border border-border/60 bg-surface p-6 text-center shadow-sm sm:p-8">
                {showLogo ? (
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
                ) : null}

                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-pink-main/10 text-pink-main">
                    <Icon className="h-8 w-8" aria-hidden="true" />
                </div>

                <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                    {title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    {description}
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    {onRetry ? (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="btn-primary w-full sm:flex-1"
                        >
                            {retryLabel}
                        </button>
                    ) : null}

                    <Link
                        href={secondaryHref}
                        className="btn-secondary sm:flex-1"
                    >
                        {secondaryLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
}
