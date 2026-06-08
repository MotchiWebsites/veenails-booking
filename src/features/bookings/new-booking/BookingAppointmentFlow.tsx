"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    FiArrowLeft,
    FiArrowRight,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiExternalLink,
} from "react-icons/fi";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import {
    bookingSteps,
    removalOptions,
    services,
} from "@/features/bookings/new-booking/config";
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
    formatSlotShortDate,
    formatSlotTime,
    formatSlotTimeRange,
    getDepositNote,
    getHoldNote,
    getReachableSteps,
    getSelectionSummary,
    getServiceOptionGroups,
    getStepNumber,
    getStepStatus,
    groupSlotsByDay,
    isReviewReady,
} from "@/features/bookings/new-booking/utils";
import { formatCurrency } from "@/lib/utils/money";

const DEFAULT_BOOKING_FEE_RATE = 3;

const initialSelections: BookingSelections = {
    slotId: null,
    removalId: null,
    serviceId: null,
    serviceOptionGroupId: null,
    serviceOptionId: null,
    designTierId: null,
};

export default function BookingAppointmentFlow({
    slots,
    settings,
    designTiers,
    checkoutHref = null,
}: {
    slots: AvailableAppointmentSlot[];
    settings: BookingSettingsSummary;
    designTiers: DesignTier[];
    checkoutHref?: string | null;
}) {
    const [activeStep, setActiveStep] = useState<NewBookingStep>("time");
    const [selections, setSelections] =
        useState<BookingSelections>(initialSelections);
    const [showCheckoutPlaceholder, setShowCheckoutPlaceholder] =
        useState(false);
    const shouldReduceMotion = useReducedMotion();

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
                      bookingFeeMode: "added_on_top" as const,
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
    const reviewReady = isReviewReady(selections);
    const reachableSteps = getReachableSteps(selections);
    const depositNote = getDepositNote(normalizedSettings);
    const holdNote = getHoldNote(normalizedSettings);
    const bookingFeeRate = normalizedSettings.bookingFeeRate;

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
        setShowCheckoutPlaceholder(false);
        setSelections((current) => ({
            ...current,
            slotId,
        }));
        setActiveStep("removal");
    }

    function handleRemovalSelect(removalId: BookingSelections["removalId"]) {
        setShowCheckoutPlaceholder(false);
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
        setActiveStep(removalId === "removal_only" ? "review" : "service");
    }

    function handleServiceSelect(serviceId: ServiceConfig["id"]) {
        setShowCheckoutPlaceholder(false);
        setSelections((current) => ({
            ...current,
            serviceId,
            serviceOptionGroupId: null,
            serviceOptionId: null,
            designTierId: null,
        }));
    }

    function handleServiceOptionGroupSelect(groupId: string) {
        setShowCheckoutPlaceholder(false);
        setSelections((current) => ({
            ...current,
            serviceOptionGroupId: groupId,
            serviceOptionId: null,
            designTierId: null,
        }));
    }

    function handleServiceOptionSelect(optionId: ServiceOption["id"]) {
        setShowCheckoutPlaceholder(false);
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
        setActiveStep("design");
    }

    function handleDesignTierSelect(tierId: DesignTier["id"]) {
        setShowCheckoutPlaceholder(false);
        setSelections((current) => ({
            ...current,
            designTierId: tierId,
        }));
        setActiveStep("review");
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
                selections.removalId === "removal_only" ? "removal" : "design",
            );
        }
    }

    function handleCheckoutClick() {
        // TODO: create the held booking, insert booking_line_items,
        // set hold_expires_at from booking_settings.hold_minutes,
        // then redirect to checkout once that route is implemented.
        setShowCheckoutPlaceholder(true);
    }

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

            <div
                className={
                    activeStep === "review"
                        ? "mx-auto max-w-4xl"
                        : "grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]"
                }
            >
                <div className="space-y-6 min-w-0">
                    <section className="rounded-3xl border border-border/60 bg-surface p-4 shadow-sm sm:p-5">
                        <ol className="grid gap-3 sm:grid-cols-5">
                            {bookingSteps.map((step) => {
                                const status = getStepStatus(
                                    step.id,
                                    activeStep,
                                    selections,
                                );
                                const interactive = canOpenStep(
                                    step.id,
                                    selections,
                                );

                                return (
                                    <li key={step.id}>
                                        <button
                                            type="button"
                                            className={[
                                                "flex w-full flex-col rounded-2xl border px-4 py-3 text-left transition-all duration-200",
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
                                            disabled={!interactive}
                                            aria-current={
                                                status === "current"
                                                    ? "step"
                                                    : undefined
                                            }
                                            onClick={() => updateStep(step.id)}
                                        >
                                            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                                                {getStepNumber(step.id)}
                                            </span>
                                            <span className="mt-2 text-sm font-semibold text-foreground">
                                                {step.label}
                                            </span>
                                            <span className="mt-1 text-xs text-muted">
                                                {status === "skipped"
                                                    ? "Skipped"
                                                    : status === "complete"
                                                      ? "Ready"
                                                      : status === "current"
                                                        ? "Current step"
                                                        : "Coming up"}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>

                    <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6 lg:p-7">
                        {activeStep !== "time" ? (
                            <button
                                type="button"
                                onClick={goBack}
                                className="btn-ghost mb-5 inline-flex items-center gap-2"
                            >
                                <FiArrowLeft
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Back
                            </button>
                        ) : null}

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={activeStep}
                                initial={
                                    shouldReduceMotion
                                        ? false
                                        : {
                                              opacity: 0,
                                              y:
                                                  activeStep === "review"
                                                      ? 24
                                                      : 14,
                                              scale:
                                                  activeStep === "review"
                                                      ? 0.985
                                                      : 0.995,
                                          }
                                }
                                animate={
                                    shouldReduceMotion
                                        ? undefined
                                        : {
                                              opacity: 1,
                                              y: 0,
                                              scale: 1,
                                          }
                                }
                                exit={
                                    shouldReduceMotion
                                        ? undefined
                                        : {
                                              opacity: 0,
                                              y: -10,
                                              scale: 0.995,
                                          }
                                }
                                transition={{
                                    duration:
                                        activeStep === "review" ? 0.32 : 0.24,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                {activeStep === "time" ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                                Choose a time
                                            </h2>
                                            <p className="text-sm leading-relaxed text-muted sm:text-base">
                                                Select an active appointment
                                                slot to continue to the booking
                                                questions.
                                            </p>
                                        </div>

                                        {groupedSlots.length === 0 ? (
                                            <div className="rounded-3xl border border-dashed border-border bg-background px-5 py-8 text-center shadow-sm">
                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-pink-main">
                                                    <FiCalendar
                                                        className="h-6 w-6"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                                <h3 className="mt-4 text-lg font-semibold text-foreground">
                                                    No available appointment
                                                    slots right now.
                                                </h3>
                                                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                                                    Please check back soon.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-5">
                                                {groupedSlots.map((group) => (
                                                    <div
                                                        key={group.key}
                                                        className="space-y-3"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px flex-1 bg-border/80" />
                                                            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-dark-green">
                                                                {group.label}
                                                            </h3>
                                                            <div className="h-px flex-1 bg-border/80" />
                                                        </div>

                                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                            {group.slots.map(
                                                                (slot) => {
                                                                    const selected =
                                                                        selections.slotId ===
                                                                        slot.id;

                                                                    return (
                                                                        <button
                                                                            key={
                                                                                slot.id
                                                                            }
                                                                            type="button"
                                                                            aria-pressed={
                                                                                selected
                                                                            }
                                                                            onClick={() =>
                                                                                handleSlotSelect(
                                                                                    slot.id,
                                                                                )
                                                                            }
                                                                            className={[
                                                                                "clickable rounded-3xl border p-4 text-left shadow-sm transition-all duration-200",
                                                                                selected
                                                                                    ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                                                                    : "border-border/60 bg-background hover:border-pink-200 hover:bg-pink-50/70",
                                                                            ].join(
                                                                                " ",
                                                                            )}
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div>
                                                                                    <p className="text-sm font-semibold text-dark-green">
                                                                                        {formatSlotShortDate(
                                                                                            slot.startsAt,
                                                                                        )}
                                                                                    </p>
                                                                                    <p className="mt-2 text-lg font-semibold text-foreground">
                                                                                        {formatSlotTime(
                                                                                            slot.startsAt,
                                                                                        )}
                                                                                    </p>
                                                                                    <p className="mt-1 text-sm text-muted">
                                                                                        Ends{" "}
                                                                                        {formatSlotTime(
                                                                                            slot.endsAt,
                                                                                        )}
                                                                                    </p>
                                                                                </div>

                                                                                {selected ? (
                                                                                    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-success">
                                                                                        Selected
                                                                                    </span>
                                                                                ) : null}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {activeStep === "removal" ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                                Do you need a removal?
                                            </h2>
                                            <p className="text-sm leading-relaxed text-muted sm:text-base">
                                                Choose the option that matches
                                                your current set before moving
                                                into service pricing.
                                            </p>
                                        </div>

                                        <div className="grid gap-3 lg:grid-cols-3">
                                            {removalOptions.map((option) => {
                                                const selected =
                                                    selections.removalId ===
                                                    option.id;

                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        aria-pressed={selected}
                                                        onClick={() =>
                                                            handleRemovalSelect(
                                                                option.id,
                                                            )
                                                        }
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
                                                                    {
                                                                        option.label
                                                                    }
                                                                </h3>
                                                                <p className="mt-2 text-sm leading-relaxed text-muted">
                                                                    {
                                                                        option.description
                                                                    }
                                                                </p>
                                                            </div>
                                                            <span className="text-base font-semibold text-foreground">
                                                                {option.price >
                                                                0
                                                                    ? `+${formatPrice(option.price)}`
                                                                    : formatPrice(
                                                                          0,
                                                                      )}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}

                                {activeStep === "service" ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                                Select your service
                                            </h2>
                                            <p className="text-sm leading-relaxed text-muted sm:text-base">
                                                Pick a service first, then
                                                choose the exact option and
                                                price for this appointment.
                                            </p>
                                        </div>

                                        <div className="grid gap-3 lg:grid-cols-3">
                                            {services.map((service) => {
                                                const selected =
                                                    selections.serviceId ===
                                                    service.id;

                                                return (
                                                    <button
                                                        key={service.id}
                                                        type="button"
                                                        aria-pressed={selected}
                                                        onClick={() =>
                                                            handleServiceSelect(
                                                                service.id,
                                                            )
                                                        }
                                                        className={[
                                                            "clickable rounded-3xl border p-5 text-left shadow-sm transition-all duration-200",
                                                            selected
                                                                ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                                                : "border-border/60 bg-background hover:border-pink-200 hover:bg-pink-50/70",
                                                        ].join(" ")}
                                                    >
                                                        <h3 className="text-base font-semibold text-foreground">
                                                            {service.label}
                                                        </h3>
                                                        <p className="mt-2 text-sm leading-relaxed text-muted">
                                                            {
                                                                service.description
                                                            }
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {estimate.service ? (
                                            <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                                                <div className="flex flex-col gap-2">
                                                    <h3 className="text-lg font-semibold text-dark-green">
                                                        {estimate.service.label}{" "}
                                                        options
                                                    </h3>
                                                    <p className="text-sm text-muted">
                                                        Choose one base-price
                                                        option to continue.
                                                    </p>
                                                </div>

                                                {estimate.service.id ===
                                                "structured_gel_manicure" ? (
                                                    <div className="mt-4 space-y-4">
                                                        <div className="space-y-3">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                                                                1. Choose length
                                                            </p>
                                                            <div className="grid gap-3 sm:grid-cols-2">
                                                                {serviceOptionGroups.map(
                                                                    (group) => {
                                                                        const selected =
                                                                            selectedServiceOptionGroupId ===
                                                                            group.id;

                                                                        return (
                                                                            <button
                                                                                key={
                                                                                    group.id
                                                                                }
                                                                                type="button"
                                                                                aria-pressed={
                                                                                    selected
                                                                                }
                                                                                onClick={() =>
                                                                                    handleServiceOptionGroupSelect(
                                                                                        group.id,
                                                                                    )
                                                                                }
                                                                                className={[
                                                                                    "clickable rounded-3xl border p-4 text-left shadow-sm transition-all duration-200",
                                                                                    selected
                                                                                        ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                                                                        : "border-border/60 bg-surface hover:border-pink-200 hover:bg-pink-50/70",
                                                                                ].join(
                                                                                    " ",
                                                                                )}
                                                                            >
                                                                                <h4 className="text-base font-semibold text-foreground">
                                                                                    {
                                                                                        group.label
                                                                                    }
                                                                                </h4>
                                                                            </button>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                                                                2. Choose
                                                                appointment type
                                                            </p>
                                                            {selectedServiceOptionGroupId ? (
                                                                <div className="grid gap-3 md:grid-cols-2">
                                                                    {visibleServiceOptions.map(
                                                                        (
                                                                            option,
                                                                        ) => {
                                                                            const selected =
                                                                                selections.serviceOptionId ===
                                                                                option.id;

                                                                            return (
                                                                                <button
                                                                                    key={
                                                                                        option.id
                                                                                    }
                                                                                    type="button"
                                                                                    aria-pressed={
                                                                                        selected
                                                                                    }
                                                                                    onClick={() =>
                                                                                        handleServiceOptionSelect(
                                                                                            option.id,
                                                                                        )
                                                                                    }
                                                                                    className={[
                                                                                        "clickable rounded-3xl border p-4 text-left shadow-sm transition-all duration-200",
                                                                                        selected
                                                                                            ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                                                                            : "border-border/60 bg-surface hover:border-pink-200 hover:bg-pink-50/70",
                                                                                    ].join(
                                                                                        " ",
                                                                                    )}
                                                                                >
                                                                                    <div className="flex items-start justify-between gap-4">
                                                                                        <div>
                                                                                            <h4 className="text-base font-semibold text-foreground">
                                                                                                {
                                                                                                    option.label
                                                                                                }
                                                                                            </h4>
                                                                                            {option.helperText ? (
                                                                                                <p className="mt-1 text-sm text-muted">
                                                                                                    {
                                                                                                        option.helperText
                                                                                                    }
                                                                                                </p>
                                                                                            ) : null}
                                                                                        </div>
                                                                                        <span className="text-base font-semibold text-foreground">
                                                                                            {formatPrice(
                                                                                                option.price,
                                                                                            )}
                                                                                        </span>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="rounded-3xl border border-dashed border-border bg-surface px-4 py-5 text-sm text-muted">
                                                                    Pick a
                                                                    length first
                                                                    to see the
                                                                    matching
                                                                    appointment
                                                                    types.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                        {visibleServiceOptions.map(
                                                            (option) => {
                                                                const selected =
                                                                    selections.serviceOptionId ===
                                                                    option.id;

                                                                return (
                                                                    <button
                                                                        key={
                                                                            option.id
                                                                        }
                                                                        type="button"
                                                                        aria-pressed={
                                                                            selected
                                                                        }
                                                                        onClick={() =>
                                                                            handleServiceOptionSelect(
                                                                                option.id,
                                                                            )
                                                                        }
                                                                        className={[
                                                                            "clickable rounded-3xl border p-4 text-left shadow-sm transition-all duration-200",
                                                                            selected
                                                                                ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                                                                : "border-border/60 bg-surface hover:border-pink-200 hover:bg-pink-50/70",
                                                                        ].join(
                                                                            " ",
                                                                        )}
                                                                    >
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div>
                                                                                {option.groupLabel ? (
                                                                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                                                                                        {
                                                                                            option.groupLabel
                                                                                        }
                                                                                    </p>
                                                                                ) : null}
                                                                                <h4 className="mt-2 text-base font-semibold text-foreground">
                                                                                    {
                                                                                        option.label
                                                                                    }
                                                                                </h4>
                                                                                {option.helperText ? (
                                                                                    <p className="mt-1 text-sm text-muted">
                                                                                        {
                                                                                            option.helperText
                                                                                        }
                                                                                    </p>
                                                                                ) : null}
                                                                            </div>
                                                                            <span className="text-base font-semibold text-foreground">
                                                                                {formatPrice(
                                                                                    option.price,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {activeStep === "design" ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                                Choose a design tier
                                            </h2>
                                            <p className="text-sm leading-relaxed text-muted sm:text-base">
                                                Design tier is required for
                                                full-service appointments and is
                                                added on top of the selected
                                                base price.
                                            </p>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            {designTiers.map((tier) => {
                                                const selected =
                                                    selections.designTierId ===
                                                    tier.id;

                                                return (
                                                    <button
                                                        key={tier.id}
                                                        type="button"
                                                        aria-pressed={selected}
                                                        onClick={() =>
                                                            handleDesignTierSelect(
                                                                tier.id,
                                                            )
                                                        }
                                                        className={[
                                                            "clickable rounded-3xl border p-4 text-left shadow-sm transition-all duration-200",
                                                            selected
                                                                ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                                                : "border-border/60 bg-background hover:border-pink-200 hover:bg-pink-50/70",
                                                        ].join(" ")}
                                                    >
                                                        {tier.imageSrc ? (
                                                            <div className="relative h-70 overflow-hidden rounded-2xl bg-surface-2">
                                                                <Image
                                                                    src={
                                                                        tier.imageSrc
                                                                    }
                                                                    alt={
                                                                        tier.imageAlt
                                                                    }
                                                                    fill
                                                                    sizes="(min-width: 768px) 50vw, 100vw"
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2 px-4 text-center text-sm text-muted">
                                                                Preview coming
                                                                soon
                                                            </div>
                                                        )}

                                                        <div className="mt-4 flex items-start justify-between gap-3">
                                                            <div>
                                                                <h3 className="text-base font-semibold text-foreground">
                                                                    {tier.label}
                                                                </h3>
                                                                <p className="mt-1 text-sm text-muted">
                                                                    {tier.description ??
                                                                        "Add-on design detail tier"}
                                                                </p>
                                                            </div>
                                                            <span className="text-base font-semibold text-foreground">
                                                                +
                                                                {formatPrice(
                                                                    tier.price,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <Link
                                            href="https://veenailstudio.ca/pricing#design-tiers"
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="link-default inline-flex items-center gap-2 text-sm font-medium"
                                        >
                                            View more design examples
                                            <FiExternalLink
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </div>
                                ) : null}

                                {activeStep === "review" ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                                Review your appointment
                                            </h2>
                                            <p className="text-sm leading-relaxed text-muted sm:text-base">
                                                Double-check your estimated
                                                total before moving into
                                                checkout.
                                            </p>
                                        </div>

                                        <BookingSummaryCard
                                            slotLabel={
                                                summary.slot
                                                    ? `${formatSlotShortDate(
                                                          summary.slot.startsAt,
                                                      )} · ${formatSlotTimeRange(summary.slot)}`
                                                    : null
                                            }
                                            removalLabel={
                                                estimate.removal
                                                    ?.summaryLabel ?? null
                                            }
                                            serviceLabel={
                                                estimate.service?.label ?? null
                                            }
                                            serviceOptionLabel={
                                                selectedServiceOptionLabel
                                            }
                                            designTierLabel={
                                                estimate.designTier?.label ??
                                                null
                                            }
                                            subtotal={estimate.subtotal}
                                            bookingFee={estimate.bookingFee}
                                            bookingFeeIncluded={
                                                estimate.bookingFeeIncluded
                                            }
                                            bookingFeeRate={bookingFeeRate}
                                            depositNote={depositNote}
                                            holdNote={holdNote}
                                            total={estimate.total}
                                            compact={false}
                                        />

                                        {reviewReady ? (
                                            <div className="space-y-3">
                                                {checkoutHref ? (
                                                    <Link
                                                        href={checkoutHref}
                                                        className="btn-primary w-full sm:w-auto"
                                                    >
                                                        Continue to Checkout
                                                        <FiArrowRight
                                                            className="h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                    </Link>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn-primary w-full sm:w-auto"
                                                        onClick={
                                                            handleCheckoutClick
                                                        }
                                                    >
                                                        Continue to Checkout
                                                        <FiArrowRight
                                                            className="h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                )}

                                                {showCheckoutPlaceholder ? (
                                                    <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-relaxed text-dark-green">
                                                        Checkout is the next
                                                        step. This flow
                                                        currently stops here
                                                        while the held-booking
                                                        and payment handoff is
                                                        implemented.
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <div className="rounded-3xl border border-dashed border-border bg-background p-4 text-sm leading-relaxed text-muted">
                                                Finish each required step before
                                                continuing to checkout.
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </motion.div>
                        </AnimatePresence>
                    </section>
                </div>

                {activeStep !== "review" ? (
                    <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-main">
                                    <FiCheckCircle
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">
                                        Booking summary
                                    </h2>
                                    <p className="text-sm text-muted">
                                        Your selections update as you move
                                        through the funnel.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3">
                                <StatusPanel
                                    icon={<FiClock className="h-4 w-4" />}
                                    label="Next step"
                                    value={
                                        reviewReady
                                            ? "Ready for checkout"
                                            : reachableSteps.review
                                              ? "Review"
                                              : activeStep === "time"
                                                ? "Select a time"
                                                : activeStep === "removal"
                                                  ? "Answer removal"
                                                  : activeStep === "service"
                                                    ? "Choose service"
                                                    : "Choose design tier"
                                    }
                                />
                            </div>

                            <div className="mt-5">
                                <BookingSummaryCard
                                    slotLabel={
                                        summary.slot
                                            ? `${formatSlotShortDate(
                                                  summary.slot.startsAt,
                                              )} · ${formatSlotTimeRange(summary.slot)}`
                                            : null
                                    }
                                    removalLabel={
                                        estimate.removal?.summaryLabel ?? null
                                    }
                                    serviceLabel={
                                        estimate.service?.label ?? null
                                    }
                                    serviceOptionLabel={
                                        selectedServiceOptionLabel
                                    }
                                    designTierLabel={
                                        estimate.designTier?.label ?? null
                                    }
                                    subtotal={estimate.subtotal}
                                    bookingFee={estimate.bookingFee}
                                    bookingFeeIncluded={
                                        estimate.bookingFeeIncluded
                                    }
                                    bookingFeeRate={bookingFeeRate}
                                    depositNote={depositNote}
                                    holdNote={holdNote}
                                    total={estimate.total}
                                    compact
                                />
                            </div>
                        </section>
                    </aside>
                ) : null}
            </div>
        </div>
    );
}

function BookingSummaryCard({
    slotLabel,
    removalLabel,
    serviceLabel,
    serviceOptionLabel,
    designTierLabel,
    subtotal,
    bookingFee,
    bookingFeeIncluded,
    bookingFeeRate,
    depositNote,
    holdNote,
    total,
    compact,
}: {
    slotLabel: string | null;
    removalLabel: string | null;
    serviceLabel: string | null;
    serviceOptionLabel: string | null;
    designTierLabel: string | null;
    subtotal: number;
    bookingFee: number;
    bookingFeeIncluded: boolean;
    bookingFeeRate: number;
    depositNote: string | null;
    holdNote: string | null;
    total: number;
    compact: boolean;
}) {
    const rows = [
        { label: "Appointment time", value: slotLabel ?? "Not selected yet" },
        { label: "Removal", value: removalLabel ?? "Not selected yet" },
        { label: "Service", value: serviceLabel ?? "Not selected yet" },
        {
            label: "Service option",
            value: serviceOptionLabel ?? "Not selected yet",
        },
        {
            label: "Design tier",
            value: designTierLabel ?? "Not selected yet",
        },
    ];

    return (
        <div
            className={[
                "rounded-3xl border border-border/60 bg-background shadow-sm",
                compact ? "p-4" : "p-5 sm:p-6",
            ].join(" ")}
        >
            <div className="space-y-3">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex flex-col gap-1 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                            {row.label}
                        </p>
                        <p className="text-sm font-medium leading-relaxed text-foreground">
                            {row.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-5 rounded-3xl bg-surface p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-muted">
                    <span>Estimated subtotal</span>
                    <span className="font-semibold text-foreground">
                        {formatEstimateAmount(subtotal)}
                    </span>
                </div>

                {bookingFeeRate > 0 ? (
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted">
                        <span>
                            Booking fee{" "}
                            {bookingFeeIncluded
                                ? "(included)"
                                : `(${bookingFeeRate}%)`}
                        </span>
                        <span className="font-semibold text-foreground">
                            {bookingFeeIncluded
                                ? "Included in total"
                                : formatEstimateAmount(bookingFee, true)}
                        </span>
                    </div>
                ) : null}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <span className="text-sm font-semibold text-foreground">
                        Total estimate
                    </span>
                    <span className="text-lg font-semibold text-foreground">
                        {formatEstimateAmount(total, bookingFeeRate > 0)}
                    </span>
                </div>
            </div>

            {depositNote || holdNote ? (
                <div className="mt-4 space-y-2 rounded-3xl bg-pink-50 p-4">
                    {depositNote ? (
                        <p className="text-sm leading-relaxed text-muted">
                            {depositNote}
                        </p>
                    ) : null}
                    {holdNote ? (
                        <p className="text-sm leading-relaxed text-muted">
                            {holdNote}
                        </p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

function formatEstimateAmount(amount: number, forceCents = false) {
    const hasCents = !Number.isInteger(amount);

    return formatCurrency(amount, {
        minimumFractionDigits: forceCents || hasCents ? 2 : 0,
        maximumFractionDigits: forceCents || hasCents ? 2 : 0,
    });
}

function formatPrice(amount: number) {
    return formatCurrency(amount, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function StatusPanel({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-border/60 bg-background p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-pink-main">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}
