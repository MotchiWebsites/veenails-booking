"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/shared/toast/ToastProvider";
import type {
    AvailableAppointmentSlot,
    BookingSelections,
    BookingSettingsSummary,
    DesignTier,
    NewBookingStep,
    ServiceConfig,
    ServiceOption,
} from "@/features/bookings/new-booking/types";
import {
    buildServiceOptionLabel,
    calculateEstimate,
    canOpenStep,
    getDepositNote,
    getHoldNote,
    getReachableSteps,
    getSelectionSummary,
    getService,
    getServiceOptionGroups,
    groupSlotsByDay,
    isReviewReady,
    isSlotBookable,
    normalizeBookingFeeRate,
    requiresDesignTier,
} from "@/features/bookings/new-booking/utils";
import {
    readBookingCheckoutDraft,
    writeBookingCheckoutDraft,
} from "@/lib/booking/checkout-draft";

const DEFAULT_BOOKING_FEE_RATE = 3;

const initialSelections: BookingSelections = {
    slotId: null,
    removalId: null,
    serviceId: null,
    serviceOptionGroupId: null,
    serviceOptionId: null,
    designTierId: null,
};

type UseBookingFlowProps = {
    slots: AvailableAppointmentSlot[];
    settings: BookingSettingsSummary;
    designTiers: DesignTier[];
    checkoutHref?: string | null;
    initialSlotId?: string | null;
    initialStep?: NewBookingStep | null;
};

export function useBookingFlow({
    slots,
    settings,
    designTiers,
    checkoutHref = null,
    initialSlotId = null,
    initialStep = null,
}: UseBookingFlowProps) {
    const [activeStep, setActiveStep] = useState<NewBookingStep>("time");
    const [selections, setSelections] = useState<BookingSelections>(() =>
        getInitialSelections(slots, initialSlotId),
    );
    const router = useRouter();
    const { error: showErrorToast } = useToast();

    const appliedInitialSlotRef = useRef<string | null>(
        initialSlotId &&
            slots.some((slot) => slot.id === initialSlotId && isSlotBookable(slot))
            ? initialSlotId
            : null,
    );

    useEffect(() => {
        if (!initialSlotId || appliedInitialSlotRef.current === initialSlotId) {
            return;
        }

        if (!slots.some((slot) => slot.id === initialSlotId && isSlotBookable(slot))) {
            appliedInitialSlotRef.current = initialSlotId;
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setSelections((current) =>
                current.slotId
                    ? current
                    : {
                          ...current,
                          slotId: initialSlotId,
                      },
            );
            appliedInitialSlotRef.current = initialSlotId;
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [initialSlotId, slots]);

    useEffect(() => {
        if (initialStep !== "review") {
            return;
        }

        const draft = readBookingCheckoutDraft();

        if (
            !draft ||
            !isReviewReady(draft) ||
            !slots.some((slot) => slot.id === draft.slotId && isSlotBookable(slot))
        ) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const service = getService(draft.serviceId);
            setSelections({
                slotId: draft.slotId,
                removalId: draft.removalId,
                serviceId: draft.serviceId,
                serviceOptionGroupId: draft.serviceOptionGroupId,
                serviceOptionId: draft.serviceOptionId,
                designTierId: requiresDesignTier(service)
                    ? draft.designTierId
                    : null,
            });
            setActiveStep("review");
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [initialStep, slots]);

    const groupedSlots = useMemo(() => groupSlotsByDay(slots), [slots]);
    const normalizedSettings = useMemo(
        () =>
            settings
                ? {
                      ...settings,
                      bookingFeeRate:
                          settings.bookingFeeRate > 0
                              ? settings.bookingFeeRate
                              : DEFAULT_BOOKING_FEE_RATE,
                  }
                : {
                      depositAmount: 0,
                      bookingFeeMode: "included_in_price" as const,
                      bookingFeeRate: DEFAULT_BOOKING_FEE_RATE,
                      holdMinutes: 0,
                  },
        [settings],
    );
    const summary = useMemo(
        () => getSelectionSummary(selections, slots, designTiers),
        [designTiers, selections, slots],
    );
    const estimate = useMemo(
        () => calculateEstimate(selections, normalizedSettings, designTiers),
        [designTiers, selections, normalizedSettings],
    );
    const hasBookableSelectedSlot = Boolean(summary.slot);
    const reviewReady = hasBookableSelectedSlot && isReviewReady(selections);
    const reachableSteps = getReachableSteps(selections);
    const depositNote = getDepositNote(normalizedSettings);
    const holdNote = getHoldNote(normalizedSettings);
    const bookingFeeRate = normalizeBookingFeeRate(
        normalizedSettings.bookingFeeRate,
    );

    const selectedServiceOptionLabel = buildServiceOptionLabel(
        estimate.service,
        estimate.serviceOption,
    );
    const serviceOptionGroups = useMemo(
        () => getServiceOptionGroups(estimate.service),
        [estimate.service],
    );
    const selectedServiceOptionGroupId =
        estimate.serviceOption?.groupId ?? selections.serviceOptionGroupId;
    const designTierRequired = requiresDesignTier(estimate.service);
    const visibleServiceOptions = useMemo(() => {
        if (!estimate.service) {
            return [];
        }

        if (
            estimate.service.id !== "structured_gel_manicure" ||
            !selectedServiceOptionGroupId
        ) {
            return estimate.service.options;
        }

        return estimate.service.options.filter(
            (option) => option.groupId === selectedServiceOptionGroupId,
        );
    }, [estimate.service, selectedServiceOptionGroupId]);

    function updateStep(nextStep: NewBookingStep) {
        if (canOpenStep(nextStep, selections)) {
            setActiveStep(nextStep);
        }
    }

    function handleSlotSelect(slotId: string) {
        const slot = slots.find((item) => item.id === slotId);
        if (!isSlotBookable(slot)) {
            return;
        }

        setSelections((current) => ({
            ...current,
            slotId,
        }));
    }

    function handleRemovalSelect(removalId: BookingSelections["removalId"]) {
        setSelections((current) => ({
            ...current,
            removalId,
            ...(removalId === "removal_only"
                ? {
                      serviceId: null,
                      serviceOptionGroupId: null,
                      serviceOptionId: null,
                      designTierId: null,
                  }
                : {}),
        }));
    }

    function handleServiceSelect(serviceId: ServiceConfig["id"]) {
        setSelections((current) => ({
            ...current,
            serviceId,
            serviceOptionGroupId: null,
            serviceOptionId: null,
            designTierId: null,
        }));
    }

    function handleServiceOptionGroupSelect(groupId: string) {
        setSelections((current) => ({
            ...current,
            serviceOptionGroupId: groupId,
            serviceOptionId: null,
            designTierId: null,
        }));
    }

    function handleServiceOptionSelect(optionId: ServiceOption["id"]) {
        setSelections((current) => ({
            ...current,
            serviceOptionId: optionId,
            ...(estimate.service?.id === "structured_gel_manicure"
                ? {
                      serviceOptionGroupId:
                          estimate.service?.options.find(
                              (option) => option.id === optionId,
                          )?.groupId ?? current.serviceOptionGroupId,
                  }
                : {}),
        }));
    }

    function handleDesignTierSelect(tierId: DesignTier["id"]) {
        setSelections((current) => ({
            ...current,
            designTierId: tierId,
        }));
    }

    function goBack() {
        if (activeStep === "removal") {
            setActiveStep("time");
            return;
        }

        if (activeStep === "service") {
            setActiveStep("removal");
            return;
        }

        if (activeStep === "design") {
            setActiveStep("service");
            return;
        }

        if (activeStep === "review") {
            setActiveStep(
                selections.removalId === "removal_only"
                    ? "removal"
                    : designTierRequired
                      ? "design"
                      : "service",
            );
        }
    }

    function goNext() {
        if (activeStep === "time") {
            if (hasBookableSelectedSlot) {
                setActiveStep("removal");
            }

            return;
        }

        if (activeStep === "removal") {
            if (!selections.removalId) return;

            setActiveStep(
                selections.removalId === "removal_only" ? "review" : "service",
            );
            return;
        }

        if (activeStep === "service") {
            if (!selections.serviceId || !selections.serviceOptionId) return;

            if (
                estimate.service?.id === "structured_gel_manicure" &&
                !selectedServiceOptionGroupId
            ) {
                return;
            }

            setActiveStep(designTierRequired ? "design" : "review");
            return;
        }

        if (activeStep === "design") {
            if (!selections.designTierId) return;

            setActiveStep("review");
            return;
        }

        if (activeStep === "review") {
            handleCheckoutClick();
        }
    }

    const nextDisabledReason =
        activeStep === "time"
            ? hasBookableSelectedSlot
                ? null
                : "Select an appointment time to continue."
            : activeStep === "removal"
              ? selections.removalId
                  ? null
                  : "Choose whether you need a removal."
              : activeStep === "service"
                ? !selections.serviceId
                    ? "Select a service to continue."
                    : estimate.service?.id === "structured_gel_manicure" &&
                        !selectedServiceOptionGroupId
                      ? "Choose a length to continue."
                      : !selections.serviceOptionId
                        ? "Choose an appointment type to continue."
                        : null
                : activeStep === "design"
                  ? !designTierRequired || selections.designTierId
                      ? null
                      : "Choose a design tier to continue."
                  : reviewReady
                    ? null
                    : "Complete the required steps before checkout.";

    function handleCheckoutClick() {
        if (!checkoutHref || !summary.slot || !reviewReady) {
            return;
        }

        try {
            writeBookingCheckoutDraft({
                version: 1,
                savedAt: new Date().toISOString(),
                slotId: selections.slotId,
                removalId: selections.removalId,
                serviceId: selections.serviceId,
                serviceOptionGroupId: selections.serviceOptionGroupId,
                serviceOptionId: selections.serviceOptionId,
                designTierId: designTierRequired
                    ? selections.designTierId
                    : null,
                slotStartsAt: summary.slot.startsAt,
                slotEndsAt: summary.slot.endsAt,
            });

            router.push(checkoutHref);
        } catch {
            showErrorToast(
                "We couldn't carry your booking selections into checkout. Please try again.",
                "Checkout unavailable",
            );
        }
    }

    return {
        activeStep,
        setActiveStep,
        selections,
        setSelections,
        groupedSlots,
        normalizedSettings,
        summary,
        estimate,
        reviewReady,
        reachableSteps,
        depositNote,
        holdNote,
        bookingFeeRate,
        designTierRequired,
        selectedServiceOptionLabel,
        serviceOptionGroups,
        selectedServiceOptionGroupId,
        visibleServiceOptions,
        updateStep,
        handleSlotSelect,
        handleRemovalSelect,
        handleServiceSelect,
        handleServiceOptionGroupSelect,
        handleServiceOptionSelect,
        handleDesignTierSelect,
        goBack,
        goNext,
        handleCheckoutClick,
        nextDisabledReason,
    };
}

export type BookingFlowState = ReturnType<typeof useBookingFlow>;

function getInitialSelections(
    slots: AvailableAppointmentSlot[],
    initialSlotId: string | null,
) {
    if (
        !initialSlotId ||
        !slots.some((slot) => slot.id === initialSlotId && isSlotBookable(slot))
    ) {
        return initialSelections;
    }

    return {
        ...initialSelections,
        slotId: initialSlotId,
    };
}
