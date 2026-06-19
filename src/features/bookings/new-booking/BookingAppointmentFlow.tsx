"use client";

import { useReducedMotion } from "framer-motion";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import BookingFlowNavigation from "@/features/bookings/new-booking/components/BookingFlowNavigation";
import BookingFlowStepper from "@/features/bookings/new-booking/components/BookingFlowStepper";
import BookingStepShell from "@/features/bookings/new-booking/components/BookingStepShell";
import DesignStep from "@/features/bookings/new-booking/components/steps/DesignStep";
import RemovalStep from "@/features/bookings/new-booking/components/steps/RemovalStep";
import ReviewStep from "@/features/bookings/new-booking/components/steps/ReviewStep";
import ServiceStep from "@/features/bookings/new-booking/components/steps/service/ServiceStep";
import TimeStep from "@/features/bookings/new-booking/components/steps/TimeStep";
import { useBookingFlow } from "@/features/bookings/new-booking/hooks/useBookingFlow";
import type {
    AvailableAppointmentSlot,
    BookingSettingsSummary,
    DesignTier,
    NewBookingStep,
} from "@/features/bookings/new-booking/types";

type BookingAppointmentFlowProps = {
    slots: AvailableAppointmentSlot[];
    settings: BookingSettingsSummary;
    designTiers: DesignTier[];
    checkoutHref?: string | null;
    initialSlotId?: string | null;
    initialStep?: NewBookingStep | null;
};

export default function BookingAppointmentFlow({
    slots,
    settings,
    designTiers,
    checkoutHref = null,
    initialSlotId = null,
    initialStep = null,
}: BookingAppointmentFlowProps) {
    const flow = useBookingFlow({
        slots,
        settings,
        designTiers,
        checkoutHref,
        initialSlotId,
        initialStep,
    });
    const shouldReduceMotion = useReducedMotion();

    return (
        <div className="space-y-6 lg:space-y-8">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7 lg:p-8">
                <SectionIntro
                    eyebrow="Appointments"
                    title="Book an Appointment"
                    description="Choose an available time, select your service, and review your estimated total before checkout."
                    align="left"
                />
            </section>

            <div className="mx-auto max-w-4xl">
                <div className="min-w-0 space-y-6">
                    <BookingFlowStepper
                        activeStep={flow.activeStep}
                        selections={flow.selections}
                        onStepClick={flow.updateStep}
                    />

                    <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6 lg:p-7">
                        <BookingFlowNavigation
                            activeStep={flow.activeStep}
                            nextDisabledReason={flow.nextDisabledReason}
                            onBack={flow.goBack}
                            onNext={flow.goNext}
                            onTop={true}
                        />

                        <BookingStepShell
                            activeStep={flow.activeStep}
                            shouldReduceMotion={shouldReduceMotion}
                        >
                            {flow.activeStep === "time" ? (
                                <TimeStep
                                    groupedSlots={flow.groupedSlots}
                                    selectedSlotId={flow.selections.slotId}
                                    onSelectSlot={flow.handleSlotSelect}
                                />
                            ) : null}

                            {flow.activeStep === "removal" ? (
                                <RemovalStep
                                    selectedRemovalId={
                                        flow.selections.removalId
                                    }
                                    onSelectRemoval={flow.handleRemovalSelect}
                                />
                            ) : null}

                            {flow.activeStep === "service" ? (
                                <ServiceStep
                                    selectedServiceId={
                                        flow.selections.serviceId
                                    }
                                    selectedServiceOptionId={
                                        flow.selections.serviceOptionId
                                    }
                                    selectedServiceOptionGroupId={
                                        flow.selectedServiceOptionGroupId
                                    }
                                    estimate={flow.estimate}
                                    serviceOptionGroups={
                                        flow.serviceOptionGroups
                                    }
                                    visibleServiceOptions={
                                        flow.visibleServiceOptions
                                    }
                                    onSelectService={flow.handleServiceSelect}
                                    onSelectServiceOptionGroup={
                                        flow.handleServiceOptionGroupSelect
                                    }
                                    onSelectServiceOption={
                                        flow.handleServiceOptionSelect
                                    }
                                />
                            ) : null}

                            {flow.activeStep === "design" ? (
                                <DesignStep
                                    designTiers={designTiers}
                                    selectedDesignTierId={
                                        flow.selections.designTierId
                                    }
                                    onSelectDesignTier={
                                        flow.handleDesignTierSelect
                                    }
                                />
                            ) : null}

                            {flow.activeStep === "review" ? (
                                <ReviewStep
                                    summary={flow.summary}
                                    estimate={flow.estimate}
                                    selectedServiceOptionLabel={
                                        flow.selectedServiceOptionLabel
                                    }
                                    depositNote={flow.depositNote}
                                    holdNote={flow.holdNote}
                                    bookingFeeRate={flow.bookingFeeRate}
                                    reviewReady={flow.reviewReady}
                                />
                            ) : null}
                        </BookingStepShell>

                        <BookingFlowNavigation
                            activeStep={flow.activeStep}
                            nextDisabledReason={flow.nextDisabledReason}
                            onBack={flow.goBack}
                            onNext={flow.goNext}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}
