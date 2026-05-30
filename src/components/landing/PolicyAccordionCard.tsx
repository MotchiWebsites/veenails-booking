"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import type { LandingPolicy } from "@/types/landing";

export default function PolicyAccordionCard({
    policy,
}: {
    policy: LandingPolicy;
}) {
    const [open, setOpen] = useState(false);

    return (
        <article className="rounded-2xl border border-border/50 bg-surface shadow-sm self-start transform transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-border/70">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="grid w-full grid-cols-[1fr_auto] items-start gap-4 px-5 py-4 text-left"
            >
                <span className="text-sm font-semibold sm:text-base">
                    {policy.title}
                </span>

                <span className="pointer-events-none mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-muted">
                    <FiChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                            open ? "rotate-180" : ""
                        }`}
                    />
                </span>
            </button>

            <div
                className={`grid transition-all duration-200 ease-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted">
                        {policy.description}
                    </p>
                </div>
            </div>
        </article>
    );
}
