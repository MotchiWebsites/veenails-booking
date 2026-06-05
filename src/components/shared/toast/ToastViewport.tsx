"use client";

import ToastItem from "@/components/shared/toast/ToastItem";
import type { AppToast } from "@/components/shared/toast/toast-types";

export default function ToastViewport({
    toasts,
    removeToast,
    togglePause,
}: {
    toasts: AppToast[];
    removeToast: (id: string) => void;
    togglePause: (id: string) => void;
}) {
    return (
        <div
            aria-live="polite"
            aria-atomic="false"
            className="fixed z-50 left-4 right-4 bottom-4 flex flex-col items-center gap-3 sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto sm:items-end sm:w-[min(24rem,calc(100vw-2rem))]"
        >
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    removeToast={removeToast}
                    togglePause={togglePause}
                />
            ))}
        </div>
    );
}
