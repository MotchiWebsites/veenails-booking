"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import type { AppToast, ToastVariant } from "@/components/toast/toast-types";
import ToastViewport from "@/components/toast/ToastViewport";

type ToastInput = {
    title?: string;
    message: string;
    variant?: ToastVariant;
    duration?: number;
};

type ToastContextValue = {
    toast: (input: ToastInput) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    removeToast: (id: string) => void;
    togglePause: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ToastProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [toasts, setToasts] = useState<AppToast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const togglePause = useCallback((id: string) => {
        setToasts((current) =>
            current.map((toast) =>
                toast.id === id
                    ? {
                          ...toast,
                          paused: !toast.paused,
                      }
                    : toast,
            ),
        );
    }, []);

    const toast = useCallback((input: ToastInput) => {
        const nextToast: AppToast = {
            id: createToastId(),
            title: input.title,
            message: input.message,
            variant: input.variant ?? "info",
            duration: input.duration ?? 5200,
            paused: false,
        };

        setToasts((current) => [nextToast, ...current].slice(0, 4));
    }, []);

    const value = useMemo<ToastContextValue>(
        () => ({
            toast,
            success: (message, title) =>
                toast({ message, title, variant: "success" }),
            error: (message, title) =>
                toast({ message, title, variant: "error" }),
            info: (message, title) =>
                toast({ message, title, variant: "info" }),
            warning: (message, title) =>
                toast({ message, title, variant: "warning" }),
            removeToast,
            togglePause,
        }),
        [removeToast, toast, togglePause],
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastViewport
                toasts={toasts}
                removeToast={removeToast}
                togglePause={togglePause}
            />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used within ToastProvider.");
    }

    return context;
}
