"use client";

import { removalOptions } from "@/features/bookings/new-booking/config";
import type { BookingSelections } from "@/features/bookings/new-booking/types";
import { formatPrice } from "@/features/bookings/new-booking/utils/booking-flow-formatters";

type RemovalStepProps = {
    selectedRemovalId: BookingSelections["removalId"];
    onSelectRemoval: (removalId: BookingSelections["removalId"]) => void;
};

export default function RemovalStep({
    selectedRemovalId,
    onSelectRemoval,
}: RemovalStepProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Do you need a removal?
                </h2>
                <p className="text-sm leading-relaxed text-muted sm:text-base">
                    Choose the option that matches your current set before
                    moving into service pricing.
                </p>
            </div>

            <div className="grid gap-3 2xl:grid-cols-3">
                {removalOptions.map((option) => {
                    const selected = selectedRemovalId === option.id;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onSelectRemoval(option.id)}
                            className={[
                                "clickable rounded-3xl border p-5 text-left shadow-sm transition-all duration-200",
                                selected
                                    ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                    : "border-border/60 bg-background hover:border-pink-200 hover:bg-pink-50/70",
                            ].join(" ")}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        {option.label}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted">
                                        {option.description}
                                    </p>
                                </div>
                                <span className="text-base font-semibold text-foreground">
                                    {option.price > 0
                                        ? `+${formatPrice(option.price)}`
                                        : formatPrice(0)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
