"use client";

import { FiHelpCircle } from "react-icons/fi";

export default function FieldHintToggle({
    open,
    onClick,
    controlsId,
    title = "Helpful info",
    children,
    showDefaultText = false,
}: {
    open: boolean;
    onClick: () => void;
    controlsId: string;
    title?: string;
    children?: React.ReactNode;
    // when true and `children` is not provided, render a small default hint text
    showDefaultText?: boolean;
}) {
    return (
        <div className="inline-flex items-start gap-3">
            <button
                type="button"
                onClick={onClick}
                aria-expanded={open}
                aria-controls={controlsId}
                aria-label={open ? `Hide ${title}` : `Show ${title}`}
                className="flex h-6 w-6 p-px shrink-0 items-center justify-center rounded-full bg-pink-main/90 text-white shadow-sm transition-all duration-200 hover:bg-pink-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <FiHelpCircle className="h-4 w-4" aria-hidden="true" />
            </button>

            {(open && (children || showDefaultText)) ? (
                <div
                    id={controlsId}
                    className="rounded-md bg-surface/95 p-2 text-xs leading-relaxed text-muted sm:text-sm"
                >
                    {children ? children : <span>Did you know? Vee&apos;s Nails offers a 10% discount for first-time customers!</span>}
                </div>
            ) : null}
        </div>
    );
}
