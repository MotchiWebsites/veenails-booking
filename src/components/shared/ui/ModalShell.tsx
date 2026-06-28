"use client";

import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { IoClose } from "react-icons/io5";

export default function ModalShell({
    title,
    description,
    children,
    onClose,
}: {
    title?: string;
    description?: ReactNode;
    children: ReactNode;
    onClose: () => void;
}) {
    const reduceMotion = useReducedMotion();

    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                className="mx-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-lg sm:mx-0"
                initial={
                    reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 24, scale: 0.97 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                    reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 16, scale: 0.98 }
                }
                transition={{
                    duration: reduceMotion ? 0 : 0.22,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <div className="flex w-full shrink-0 items-start justify-between border-b border-border/50 px-6 py-5">
                    <div>
                        {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
                        {description ? <div className="mt-2 text-sm text-muted">{description}</div> : null}
                    </div>

                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="text-muted"
                    >
                        <IoClose className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
                    {children}
                </div>
            </motion.div>
        </motion.div>,
        document.body,
    );
}
