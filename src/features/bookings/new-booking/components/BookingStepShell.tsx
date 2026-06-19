"use client";

import type { ReactNode } from "react";
import AnimatedStepPanel from "@/components/shared/motion/AnimatedStepPanel";
import type { NewBookingStep } from "@/features/bookings/new-booking/types";

type BookingStepShellProps = {
    activeStep: NewBookingStep;
    shouldReduceMotion: boolean | null;
    children: ReactNode;
};

export default function BookingStepShell({
    activeStep,
    shouldReduceMotion,
    children,
}: BookingStepShellProps) {
    return (
        <AnimatedStepPanel
            panelKey={activeStep}
            shouldReduceMotion={shouldReduceMotion}
            variant={activeStep === "review" ? "review" : "standard"}
        >
            {children}
        </AnimatedStepPanel>
    );
}
