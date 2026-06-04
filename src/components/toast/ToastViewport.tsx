"use client";

import ToastItem from "@/components/toast/ToastItem";
import type { AppToast } from "@/components/toast/toast-types";

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
            className="fixed left-4 right-4 top-4 z-100 flex flex-col gap-3 sm:left-auto sm:w-[min(24rem,calc(100vw-2rem))]"
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
