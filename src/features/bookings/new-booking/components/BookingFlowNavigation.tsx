"use client";

import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import type { NewBookingStep } from "@/features/bookings/new-booking/types";

type BookingFlowNavigationProps = {
    activeStep: NewBookingStep;
    nextDisabledReason: string | null;
    onBack: () => void;
    onNext: () => void;
    onTop?: boolean;
};

export default function BookingFlowNavigation({
    activeStep,
    nextDisabledReason,
    onBack,
    onNext,
    onTop = false,
}: BookingFlowNavigationProps) {
    return (
        <div className={`flex flex-col gap-4 ${onTop ? "mb-6 pb-5 border-b border-border/60" : "mt-6 pt-5 border-t border-border/60"} sm:flex-row sm:items-center sm:justify-between`}>
            <div className="text-sm leading-relaxed text-muted">
                {nextDisabledReason ? (
                    <p>{nextDisabledReason}</p>
                ) : activeStep === "review" ? (
                    <p>You can continue to checkout now.</p>
                ) : (
                    <p>Click next to continue.</p>
                )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {activeStep !== "time" ? (
                    <button
                        type="button"
                        onClick={onBack}
                        className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                        <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back
                    </button>
                ) : null}

                <button
                    type="button"
                    onClick={onNext}
                    disabled={Boolean(nextDisabledReason)}
                    className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {activeStep === "review" ? "Continue to Checkout" : "Next"}
                    <FiArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
