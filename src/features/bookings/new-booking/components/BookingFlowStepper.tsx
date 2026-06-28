"use client";

import HorizontalStepNav from "@/components/shared/ui/HorizontalStepNav";
import type {
    BookingSelections,
    NewBookingStep,
} from "@/features/bookings/new-booking/types";
import {
    canOpenStep,
    getStepStatus,
    getVisibleBookingSteps,
} from "@/features/bookings/new-booking/utils";

type BookingFlowStepperProps = {
    activeStep: NewBookingStep;
    selections: BookingSelections;
    onStepClick: (step: NewBookingStep) => void;
};

export default function BookingFlowStepper({
    activeStep,
    selections,
    onStepClick,
}: BookingFlowStepperProps) {
    const visibleSteps = getVisibleBookingSteps(selections);

    return (
        <HorizontalStepNav
            items={visibleSteps}
            activeKey={activeStep}
            getKey={(step) => step.id}
            itemClassName="w-44 shrink-0 sm:w-50"
            renderItem={(step) => {
                const status = getStepStatus(
                    step.id,
                    activeStep,
                    selections,
                );
                const interactive = canOpenStep(step.id, selections);
                const statusLabel =
                    status === "skipped"
                        ? "Skipped"
                        : status === "complete"
                          ? "Ready"
                          : status === "current"
                            ? "Current step"
                            : "Coming up";

                return (
                    <button
                        type="button"
                        disabled={!interactive}
                        aria-current={status === "current" ? "step" : undefined}
                        onClick={() => onStepClick(step.id)}
                        className={[
                            "group flex h-full w-full flex-col rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            status === "current"
                                ? "border-pink-300 bg-pink-50 shadow-sm"
                                : "",
                            status === "complete"
                                ? "border-green-200 bg-green-50"
                                : "",
                            status === "skipped"
                                ? "border-border/50 bg-background text-muted"
                                : "",
                            status === "upcoming"
                                ? "border-border/60 bg-background"
                                : "",
                            interactive
                                ? "clickable hover:border-pink-200 hover:bg-pink-50/70"
                                : "cursor-not-allowed opacity-70",
                        ].join(" ")}
                    >
                        <span className="flex items-center justify-between gap-3">
                            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted">
                                {visibleSteps.findIndex(
                                    (item) => item.id === step.id,
                                ) + 1}
                            </span>

                            <span
                                className={[
                                    "h-2 w-2 rounded-full",
                                    status === "current"
                                        ? "bg-pink-main"
                                        : status === "complete"
                                          ? "bg-green-500"
                                          : "bg-border",
                                ].join(" ")}
                                aria-hidden="true"
                            />
                        </span>

                        <span className="mt-3 line-clamp-1 text-sm font-semibold text-foreground">
                            {step.label}
                        </span>

                        <span className="mt-1 text-xs text-muted">
                            {statusLabel}
                        </span>
                    </button>
                );
            }}
        />
    );
}
