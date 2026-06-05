"use client";
import { CgSpinner } from "react-icons/cg";

export default function AppLoadingScreen({
    title = "Loading",
    description = "Please wait while we process your request.",
    fullScreen = false,
}: {
    title?: string;
    description?: string;
    fullScreen?: boolean;
}) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex items-center justify-center p-6 ${fullScreen ? "min-h-screen" : "w-full"}`}
        >
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-main/10 text-pink-main">
                    <CgSpinner className="h-12 w-12 text-pink-main animate-spin" />
                </div>

                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted">{description}</p>
            </div>
        </div>
    );
}
