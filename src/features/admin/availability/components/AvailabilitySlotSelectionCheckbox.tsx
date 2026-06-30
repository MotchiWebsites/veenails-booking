"use client";

import { FiCheck } from "react-icons/fi";

export default function AvailabilitySlotSelectionCheckbox({
    slotId,
    checked,
    onCheckedChange,
}: {
    slotId: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <label
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:border-dark-green/30"
            htmlFor={`select-slot-${slotId}`}
        >
            <input
                id={`select-slot-${slotId}`}
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                onChange={(event) => onCheckedChange(event.target.checked)}
            />
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-background text-transparent transition peer-checked:border-dark-green peer-checked:bg-dark-green peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                <FiCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>Select slot</span>
        </label>
    );
}
