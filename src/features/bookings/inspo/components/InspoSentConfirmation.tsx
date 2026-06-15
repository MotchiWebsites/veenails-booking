"use client";

import { FiCheckCircle } from "react-icons/fi";

export default function InspoSentConfirmation() {
    return (
        <div className="flex items-start gap-3 rounded-3xl border border-green-200 bg-green-50 p-4 text-left">
            <FiCheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-success"
                aria-hidden="true"
            />
            <div>
                <p className="text-sm font-semibold text-foreground">
                    Inspo sent
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                    The studio will review it with your booking.
                </p>
            </div>
        </div>
    );
}
