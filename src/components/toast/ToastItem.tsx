"use client";

import { useEffect, useRef, useState } from "react";
import {
    FiAlertCircle,
    FiCheckCircle,
    FiInfo,
    FiPause,
    FiPlay,
    FiX,
} from "react-icons/fi";
import type { AppToast } from "@/components/toast/toast-types";

const variantStyles = {
    success: {
        icon: FiCheckCircle,
        wrapper: "border-success/25 bg-success-soft text-success",
        bar: "bg-success",
    },
    error: {
        icon: FiAlertCircle,
        wrapper: "border-danger/25 bg-danger-soft text-danger",
        bar: "bg-danger",
    },
    warning: {
        icon: FiAlertCircle,
        wrapper: "border-warning/25 bg-warning-soft text-warning",
        bar: "bg-warning",
    },
    info: {
        icon: FiInfo,
        wrapper: "border-info/25 bg-info-soft text-info",
        bar: "bg-info",
    },
};

export default function ToastItem({
    toast,
    removeToast,
    togglePause,
}: {
    toast: AppToast;
    removeToast: (id: string) => void;
    togglePause: (id: string) => void;
}) {
    const [progress, setProgress] = useState(100);
    const remainingRef = useRef(toast.duration);
    const lastFrameRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const styles = variantStyles[toast.variant];
    const Icon = styles.icon;

    useEffect(() => {
        const tick = (timestamp: number) => {
            if (lastFrameRef.current === null) {
                lastFrameRef.current = timestamp;
            }

            const elapsed = timestamp - lastFrameRef.current;
            lastFrameRef.current = timestamp;

            if (!toast.paused) {
                remainingRef.current = Math.max(
                    0,
                    remainingRef.current - elapsed,
                );

                setProgress(
                    Math.max(0, (remainingRef.current / toast.duration) * 100),
                );

                if (remainingRef.current <= 0) {
                    removeToast(toast.id);
                    return;
                }
            }

            animationFrameRef.current = requestAnimationFrame(tick);
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [removeToast, toast.duration, toast.id, toast.paused]);

    return (
        <div
            role="status"
            className={`overflow-hidden rounded-2xl border shadow-lg shadow-black/5 backdrop-blur ${styles.wrapper}`}
        >
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />

                <div className="min-w-0">
                    {toast.title ? (
                        <p className="text-sm font-semibold">{toast.title}</p>
                    ) : null}

                    <p className="text-sm leading-relaxed">{toast.message}</p>
                </div>

                <div className="flex items-start gap-1">
                    <button
                        type="button"
                        onClick={() => togglePause(toast.id)}
                        aria-label={
                            toast.paused ? "Resume toast" : "Pause toast"
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/45 transition-colors hover:bg-white/70"
                    >
                        {toast.paused ? (
                            <FiPlay className="h-4 w-4" />
                        ) : (
                            <FiPause className="h-4 w-4" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => removeToast(toast.id)}
                        aria-label="Dismiss toast"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/45 transition-colors hover:bg-white/70"
                    >
                        <FiX className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="h-1 bg-white/40">
                <div
                    className={`h-full ${styles.bar}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
