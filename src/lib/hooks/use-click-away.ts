"use client";

import { useEffect } from "react";

export function useClickAway<T extends HTMLElement>({
    ref,
    enabled = true,
    onClickAway,
}: {
    ref: React.RefObject<T | null>;
    enabled?: boolean;
    onClickAway: () => void;
}) {
    useEffect(() => {
        if (!enabled) return;

        const handlePointerDown = (event: PointerEvent) => {
            const element = ref.current;

            if (!element) return;
            if (element.contains(event.target as Node)) return;

            onClickAway();
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClickAway();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [enabled, onClickAway, ref]);
}
