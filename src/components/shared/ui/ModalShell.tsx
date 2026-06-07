"use client";

import { ReactNode } from "react";
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
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg mx-4 sm:mx-0">
                <div className="flex w-full items-start justify-between">
                    <div>
                        {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
                        {description ? <div className="mt-2 text-sm text-muted">{description}</div> : null}
                    </div>

                    <button aria-label="Close" onClick={onClose} className="text-muted">
                        <IoClose className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}
