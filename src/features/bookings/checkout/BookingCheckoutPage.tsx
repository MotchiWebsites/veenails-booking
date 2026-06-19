"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { useToast } from "@/components/shared/toast/ToastProvider";
import { submitBookingCheckout } from "@/features/bookings/checkout/actions";
import CheckoutCreditsCard from "@/features/bookings/checkout/components/credit/CheckoutCreditsCard";
import CheckoutDepositInstructionsCard from "@/features/bookings/checkout/components/CheckoutDepositInstructionsCard";
import CheckoutHeader from "@/features/bookings/checkout/components/CheckoutHeader";
import CheckoutMissingDraftState from "@/features/bookings/checkout/components/CheckoutMissingDraftState";
import CheckoutPoliciesCard from "@/features/bookings/checkout/components/CheckoutPoliciesCard";
import CheckoutStepList, {
    checkoutSteps,
    type CheckoutStepId,
} from "@/features/bookings/checkout/components/CheckoutStepList";
import CheckoutSubmitCard from "@/features/bookings/checkout/components/CheckoutSubmitCard";
import CheckoutSuccessState from "@/features/bookings/checkout/components/CheckoutSuccessState";
import CheckoutSummaryCard from "@/features/bookings/checkout/components/CheckoutSummaryCard";
import CheckoutUnavailableState from "@/features/bookings/checkout/components/CheckoutUnavailableState";
import type { BookingCheckoutSettings } from "@/features/bookings/checkout/data";
import { useBookingCheckoutDraft } from "@/features/bookings/checkout/hooks/useBookingCheckoutDraft";
import { useCheckoutCreditAmount } from "@/features/bookings/checkout/hooks/useCheckoutCreditAmount";
import type { BookingCheckoutActionState } from "@/features/bookings/checkout/types";
import type { DesignTier } from "@/features/bookings/new-booking/types";
import {
    buildServiceOptionLabel,
    calculateEstimate,
    formatSlotDate,
    getHoldNote,
    getRemovalOption,
    getService,
    getServiceOption,
    normalizeBookingFeeRate,
} from "@/features/bookings/new-booking/utils";
import type { CreditsPageData } from "@/features/credits/data/credits";
import { clearBookingCheckoutDraft } from "@/lib/booking/checkout-draft";

const initialState: BookingCheckoutActionState = {
    error: "",
    success: "",
    messageId: "",
};

function getStepIndex(step: CheckoutStepId) {
    return checkoutSteps.findIndex((item) => item.id === step);
}

export default function BookingCheckoutPage({
    settings,
    designTiers,
    credits,
    userEmail,
}: {
    settings: BookingCheckoutSettings | null;
    designTiers: DesignTier[];
    credits: CreditsPageData;
    userEmail: string | null;
}) {
    const { error: showErrorToast, success: showSuccessToast } = useToast();

    const [depositConfirmed, setDepositConfirmed] = useState(false);
    const [messageConfirmed, setMessageConfirmed] = useState(false);
    const [policiesConfirmed, setPoliciesConfirmed] = useState(false);

    const [activeStep, setActiveStep] = useState<CheckoutStepId>("summary");
    const [maxVisitedStepIndex, setMaxVisitedStepIndex] = useState(0);

    const [state, formAction, pending] = useActionState(
        submitBookingCheckout,
        initialState,
    );

    const { isClient, draft, slot } = useBookingCheckoutDraft();
    const formTopRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!state.messageId) {
            return;
        }

        if (state.error) {
            showErrorToast(state.error, "Checkout failed");
            return;
        }

        if (state.success) {
            clearBookingCheckoutDraft();
            showSuccessToast(state.success, "Booking request sent");
        }
    }, [
        showErrorToast,
        showSuccessToast,
        state.error,
        state.messageId,
        state.success,
    ]);

    const estimate = useMemo(() => {
        if (!draft || !settings) {
            return null;
        }

        return calculateEstimate(draft, settings, designTiers);
    }, [designTiers, draft, settings]);

    const removal = useMemo(
        () => (draft ? getRemovalOption(draft.removalId) : null),
        [draft],
    );

    const service = useMemo(
        () => (draft ? getService(draft.serviceId) : null),
        [draft],
    );

    const serviceOption = useMemo(
        () => (draft ? getServiceOption(service, draft.serviceOptionId) : null),
        [draft, service],
    );

    const serviceOptionLabel = buildServiceOptionLabel(service, serviceOption);

    const bookingFeeRate = normalizeBookingFeeRate(
        settings?.bookingFeeRate ?? 0,
    );

    const holdNote = settings ? getHoldNote(settings) : null;

    const {
        creditAmount,
        setCreditAmountSafely,
        maxEligibleCreditAmount,
        useAllEligibleCredit,
        clearCredit,
        totalAfterCredit,
    } = useCheckoutCreditAmount({
        totalActiveAmount: credits.totalActiveAmount,
        estimateTotal: estimate?.total ?? 0,
    });

    const etransferMessage = useMemo(() => {
        const emailPart = userEmail?.trim() || "email unavailable";
        const datePart = slot ? ` - ${formatSlotDate(slot.startsAt)}` : "";

        return `Vee booking deposit - ${emailPart}${datePart}`;
    }, [slot, userEmail]);

    const editAppointmentHref = draft?.slotId
        ? `/book?slotId=${encodeURIComponent(draft.slotId)}&step=review`
        : "/book";

    const canSubmit =
        !pending &&
        Boolean(
            draft &&
            settings &&
            depositConfirmed &&
            messageConfirmed &&
            policiesConfirmed,
        );

    const activeStepIndex = getStepIndex(activeStep);

    const nextDisabledReason =
        activeStep === "policies" && !policiesConfirmed
            ? "Accept the booking policies to continue."
            : activeStep === "deposit" &&
                (!depositConfirmed || !messageConfirmed)
              ? "Confirm that you sent the deposit and included the required e-Transfer message."
              : null;

    function goToStep(step: CheckoutStepId) {
        const nextIndex = getStepIndex(step);

        if (nextIndex > maxVisitedStepIndex) {
            return;
        }

        setActiveStep(step);
        scrollToFormTop();
    }

    function goBack() {
        if (activeStepIndex <= 0) {
            return;
        }

        setActiveStep(checkoutSteps[activeStepIndex - 1].id);
        scrollToFormTop();
    }

    function goNext() {
        if (nextDisabledReason || activeStepIndex >= checkoutSteps.length - 1) {
            return;
        }

        const nextIndex = activeStepIndex + 1;

        setMaxVisitedStepIndex((current) => Math.max(current, nextIndex));
        setActiveStep(checkoutSteps[nextIndex].id);
        scrollToFormTop();
    }

    function scrollToFormTop() {
        window.requestAnimationFrame(() => {
            formTopRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    }

    if (!isClient) {
        return (
            <div className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
                <p className="text-sm text-muted">
                    Loading checkout details...
                </p>
            </div>
        );
    }

    if (!settings) {
        return <CheckoutUnavailableState />;
    }

    if (
        state.bookingId &&
        state.bookingReference &&
        state.startsAt &&
        state.endsAt
    ) {
        return (
            <CheckoutSuccessState
                bookingId={state.bookingId}
                bookingReference={state.bookingReference}
                startsAt={state.startsAt}
                endsAt={state.endsAt}
                depositAmount={state.depositAmount ?? 0}
            />
        );
    }

    if (!draft || !slot || !estimate) {
        return <CheckoutMissingDraftState />;
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 lg:space-y-8">
            <CheckoutHeader />

            <CheckoutStepList
                activeStep={activeStep}
                maxVisitedStepIndex={maxVisitedStepIndex}
                onStepClick={goToStep}
            />

            <form action={formAction} className="space-y-6">
                <div ref={formTopRef} className="scroll-mt-6" />

                <input
                    type="hidden"
                    name="draft"
                    value={JSON.stringify(draft)}
                />

                <input
                    type="hidden"
                    name="depositConfirmed"
                    value={depositConfirmed ? "true" : "false"}
                />

                <input
                    type="hidden"
                    name="messageConfirmed"
                    value={messageConfirmed ? "true" : "false"}
                />

                <input
                    type="hidden"
                    name="policiesConfirmed"
                    value={policiesConfirmed ? "true" : "false"}
                />

                <input
                    type="hidden"
                    name="creditAmount"
                    value={creditAmount.toFixed(2)}
                />

                {activeStep === "summary" ? (
                    <CheckoutSummaryCard
                        draft={draft}
                        slot={slot}
                        estimate={estimate}
                        removal={removal}
                        service={service}
                        serviceOptionLabel={serviceOptionLabel}
                        bookingFeeRate={bookingFeeRate}
                        creditAmount={creditAmount}
                        totalAfterCredit={totalAfterCredit}
                        editHref={editAppointmentHref}
                    />
                ) : null}

                {activeStep === "policies" ? (
                    <CheckoutPoliciesCard
                        policiesConfirmed={policiesConfirmed}
                        setPoliciesConfirmed={setPoliciesConfirmed}
                    />
                ) : null}

                {activeStep === "credits" ? (
                    <CheckoutCreditsCard
                        credits={credits}
                        creditAmount={creditAmount}
                        maxEligibleCreditAmount={maxEligibleCreditAmount}
                        estimateTotal={estimate.total}
                        totalAfterCredit={totalAfterCredit}
                        setCreditAmountSafely={setCreditAmountSafely}
                        useAllEligibleCredit={useAllEligibleCredit}
                        clearCredit={clearCredit}
                    />
                ) : null}

                {activeStep === "deposit" ? (
                    <CheckoutDepositInstructionsCard
                        etransferEmail={settings.etransferEmail}
                        depositAmount={settings.depositAmount}
                        holdNote={holdNote}
                        etransferMessage={etransferMessage}
                        depositConfirmed={depositConfirmed}
                        onDepositConfirmedChange={setDepositConfirmed}
                        messageConfirmed={messageConfirmed}
                        onMessageConfirmedChange={setMessageConfirmed}
                    />
                ) : null}

                {activeStep === "submit" ? (
                    <CheckoutSubmitCard
                        depositConfirmed={depositConfirmed}
                        setDepositConfirmed={setDepositConfirmed}
                        canSubmit={canSubmit}
                        pending={pending}
                        error={state.error}
                    />
                ) : null}

                {activeStep !== "submit" ? (
                    <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <p className="text-sm leading-relaxed text-muted">
                            {nextDisabledReason ??
                                "Continue when you're ready."}
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {activeStepIndex > 0 ? (
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="btn-secondary justify-center"
                                >
                                    Back
                                </button>
                            ) : null}

                            <button
                                type="button"
                                onClick={goNext}
                                disabled={Boolean(nextDisabledReason)}
                                className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-start">
                        <button
                            type="button"
                            onClick={goBack}
                            className="btn-secondary justify-center"
                        >
                            Back
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
