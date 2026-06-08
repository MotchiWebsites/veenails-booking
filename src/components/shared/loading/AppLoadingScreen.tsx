"use client";

import Image from "next/image";
import { CgSpinner } from "react-icons/cg";

export default function AppLoadingScreen({
    title = "Loading",
    description = "Please wait while we get everything ready.",
    fullScreen = false,
    branded = true,
}: {
    title?: string;
    description?: string;
    fullScreen?: boolean;
    branded?: boolean;
}) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={[
                "flex items-center justify-center p-5 sm:p-6 my-auto",
                fullScreen ? "min-h-screen bg-background" : "w-full",
            ].join(" ")}
        >
            <div className="w-full max-w-md rounded-3xl border border-border/60 bg-surface p-6 text-center shadow-sm sm:p-8">
                {branded && (
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full">
                            <Image
                                src="/logo.png"
                                alt="Vee's Nail Studio"
                                fill
                                sizes="48px"
                                className="object-cover"
                                priority={fullScreen}
                            />
                        </div>
                    </div>
                )}

                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-pink-main/10 text-pink-main">
                    <CgSpinner
                        className="h-9 w-9 animate-spin text-pink-main"
                        aria-hidden="true"
                    />
                </div>

                <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                    {title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    {description}
                </p>
            </div>
        </div>
    );
}
