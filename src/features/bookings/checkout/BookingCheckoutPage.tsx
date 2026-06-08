"use client";

import Link from "next/link";
import {
    useActionState,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from "react";
import { FiArrowLeft, FiCheckCircle, FiClock, FiCopy, FiMail } from "react-icons/fi";
import FormCheckbox from "@/components/shared/form/FormCheckbox";
import AppErrorState from "@/components/shared/feedback/AppErrorState";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { submitBookingCheckout } from "@/features/bookings/checkout/actions";
import type { BookingCheckoutSettings } from "@/features/bookings/checkout/data";
import type { BookingCheckoutActionState } from "@/features/bookings/checkout/types";
import type {
    AvailableAppointmentSlot,
    DesignTier,
} from "@/features/bookings/new-booking/types";
import {
    buildServiceOptionLabel,
    calculateEstimate,
    formatSlotDate,
    formatSlotTimeRange,
    getRemovalOption,
    getService,
    getServiceOption,
    getHoldNote,
    normalizeBookingFeeRate,
} from "@/features/bookings/new-booking/utils";
import {
    clearBookingCheckoutDraft,
    readBookingCheckoutDraft,
    readBookingCheckoutDraftRaw,
    type BookingCheckoutDraft,
} from "@/lib/booking/checkout-draft";
import { formatCurrency } from "@/lib/utils/money";

const initialState: BookingCheckoutActionState = {
    error: "",
    success: "",
    messageId: "",
};

function formatAmount(amount: number, forceCents = false) {
    const hasCents = !Number.isInteger(amount);

    return formatCurrency(amount, {
        minimumFractionDigits: forceCents || hasCents ? 2 : 0,
        maximumFractionDigits: forceCents || hasCents ? 2 : 0,
    });
}

function buildSlotFromDraft(draft: BookingCheckoutDraft): AvailableAppointmentSlot {
    return {
        id: draft.slotId ?? "",
        startsAt: draft.slotStartsAt,
        endsAt: draft.slotEndsAt,
    };
}

export default function BookingCheckoutPage({
    settings,
    designTiers,
}: {
    settings: BookingCheckoutSettings | null;
    designTiers: DesignTier[];
}) {
    const { error: showErrorToast, success: showSuccessToast } = useToast();
    const [depositConfirmed, setDepositConfirmed] = useState(false);
    const [policiesConfirmed, setPoliciesConfirmed] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [state, formAction, pending] = useActionState(
        submitBookingCheckout,
        initialState,
    );

    const isClient = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    const draftRaw = useSyncExternalStore(
        subscribeToCheckoutDraft,
        readBookingCheckoutDraftRaw,
        () => null,
    );
    const draft = useMemo(() => {
        if (!draftRaw) {
            return null;
        }

        return readBookingCheckoutDraft();
    }, [draftRaw]);

    useEffect(() => {
        if (!copiedEmail) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setCopiedEmail(false);
        }, 1800);

        return () => window.clearTimeout(timeout);
    }, [copiedEmail]);

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

    const slot = useMemo(() => (draft ? buildSlotFromDraft(draft) : null), [draft]);
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

    const canSubmit =
        !pending &&
        Boolean(draft && settings && depositConfirmed && policiesConfirmed);

    async function handleCopyEmail() {
        if (!settings?.etransferEmail) {
            return;
        }

        try {
            await navigator.clipboard.writeText(settings.etransferEmail);
            setCopiedEmail(true);
            showSuccessToast("Email copied.", "Copied");
        } catch {
            showErrorToast("We couldn't copy the email. Please copy it manually.");
        }
    }

    if (!isClient) {
        return (
            <div className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
                <p className="text-sm text-muted">Loading checkout details...</p>
            </div>
        );
    }

    if (!settings) {
        return (
            <AppErrorState
                title="Checkout is unavailable"
                description="Booking settings could not be loaded right now. Please try again shortly."
                secondaryHref="/book"
                secondaryLabel="Start Booking Again"
                showLogo={false}
            />
        );
    }

    if (state.bookingReference && state.startsAt && state.endsAt) {
        return (
            <section className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm sm:p-8">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-success">
                        <FiCheckCircle className="h-8 w-8" aria-hidden="true" />
                    </div>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-dark-green">
                        Booking Request Sent
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Booking Request Sent
                    </h1>
                    <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                        Your appointment request has been received and your deposit is
                        marked as sent. The studio will confirm your appointment after
                        reviewing and receiving the e-Transfer.
                    </p>

                    <div className="mt-8 grid gap-4 rounded-3xl bg-background p-5 text-left sm:grid-cols-3 sm:p-6">
                        <SummaryBlock
                            label="Booking reference"
                            value={state.bookingReference}
                        />
                        <SummaryBlock
                            label="Appointment"
                            value={`${formatSlotDate(state.startsAt)} · ${formatSlotTimeRange({
                                id: "confirmed-slot",
                                startsAt: state.startsAt,
                                endsAt: state.endsAt,
                            })}`}
                        />
                        <SummaryBlock
                            label="Deposit"
                            value={formatAmount(state.depositAmount ?? 0, true)}
                        />
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link href="/booking" className="btn-primary">
                            View My Bookings
                        </Link>
                        <Link href="/" className="btn-secondary">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    if (!draft || !slot || !estimate) {
        return (
            <AppErrorState
                title="Your booking selections were not found"
                description="Please return to the booking flow and choose your appointment details again before checkout."
                secondaryHref="/book"
                secondaryLabel="Start Booking Again"
                showLogo={false}
            />
        );
    }

    const holdNote = getHoldNote(settings);
    const serviceOptionLabel = buildServiceOptionLabel(service, serviceOption);
    const bookingFeeRate = normalizeBookingFeeRate(settings.bookingFeeRate);

    return (
        <div className="space-y-6 lg:space-y-8">
            <section className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm sm:p-7">
                <Link href="/book" className="btn-ghost inline-flex items-center gap-2">
                    <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to booking
                </Link>

                <div className="mt-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-dark-green">
                        Checkout
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                        Confirm Your Deposit
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                        Send your Interac e-Transfer deposit, then confirm it below.
                        Once submitted, your booking request is held for studio review.
                    </p>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
                <form action={formAction} className="min-w-0 space-y-6">
                    <input type="hidden" name="draft" value={JSON.stringify(draft)} />
                    <input
                        type="hidden"
                        name="depositConfirmed"
                        value={depositConfirmed ? "true" : "false"}
                    />
                    <input
                        type="hidden"
                        name="policiesConfirmed"
                        value={policiesConfirmed ? "true" : "false"}
                    />

                    <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-main">
                                <FiMail className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-semibold text-foreground">
                                    Deposit Instructions
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-muted">
                                    Please send your deposit by Interac e-Transfer
                                    before confirming this request.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4">
                            <InstructionCard
                                label="Deposit amount"
                                value={formatAmount(settings.depositAmount, true)}
                            />
                            <div className="rounded-3xl border border-border/60 bg-background p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                                    Send to
                                </p>
                                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="break-all text-base font-semibold text-foreground">
                                        {settings.etransferEmail ?? "Email unavailable"}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleCopyEmail}
                                        disabled={!settings.etransferEmail}
                                        aria-label="Copy Interac e-Transfer email"
                                        className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <FiCopy className="h-4 w-4" aria-hidden="true" />
                                        <span className="hidden md:inline-block md:text-sm md:font-medium">Copy</span>
                                    </button>
                                </div>
                                <p
                                    className={`mt-2 text-xs ${copiedEmail ? "text-success" : "text-muted"}`}
                                >
                                    {copiedEmail
                                        ? "Email copied."
                                        : "Use this email as the deposit recipient."}
                                </p>
                            </div>
                        </div>

                        {holdNote ? (
                            <div className="mt-5 rounded-3xl bg-pink-50 p-4 text-sm leading-relaxed text-muted">
                                {holdNote}
                            </div>
                        ) : null}
                    </section>

                    <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-pink-main">
                                <FiClock className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    Confirm before submitting
                                </h2>
                                <p className="text-sm text-muted">
                                    Both confirmations are required to continue.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <FormCheckbox
                                id="deposit-confirmed"
                                name="deposit-confirmed"
                                checked={depositConfirmed}
                                onCheckedChange={setDepositConfirmed}
                                required
                            >
                                I have sent the e-Transfer deposit.
                            </FormCheckbox>

                            <FormCheckbox
                                id="policies-confirmed"
                                name="policies-confirmed"
                                checked={policiesConfirmed}
                                onCheckedChange={setPoliciesConfirmed}
                                required
                            >
                                I have read and agree to the{" "}
                                <Link
                                    href="/legal/privacy-policy.pdf"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="link-default font-semibold"
                                >
                                    Privacy Policy
                                </Link>{" "}
                                and{" "}
                                <Link
                                    href="/legal/terms-of-service.pdf"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="link-default font-semibold"
                                >
                                    Terms
                                </Link>
                                .
                            </FormCheckbox>
                        </div>

                        {state.error ? (
                            <div className="mt-5 rounded-3xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
                                {state.error}
                            </div>
                        ) : null}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted">
                                Your request will be marked as sent once submitted.
                            </p>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {pending ? "Sending Request..." : "Send Booking Request"}
                            </button>
                        </div>
                    </section>
                </form>

                <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                    <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
                        <h2 className="text-xl font-semibold text-foreground">
                            Appointment Summary
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                            Review the appointment details and estimated pricing before
                            sending your request.
                        </p>

                        <div className="mt-5 space-y-3">
                            <SummaryRow
                                label="Date"
                                value={formatSlotDate(slot.startsAt)}
                            />
                            <SummaryRow
                                label="Time"
                                value={formatSlotTimeRange(slot)}
                            />
                            <SummaryRow
                                label="Removal"
                                value={removal?.summaryLabel ?? "Not selected"}
                            />
                            {draft.removalId !== "removal_only" ? (
                                <>
                                    <SummaryRow
                                        label="Service"
                                        value={service?.label ?? "Not selected"}
                                    />
                                    <SummaryRow
                                        label="Service option"
                                        value={serviceOptionLabel ?? "Not selected"}
                                    />
                                    <SummaryRow
                                        label="Design tier"
                                        value={estimate.designTier?.label ?? "Not selected"}
                                    />
                                </>
                            ) : null}
                        </div>

                        <div className="mt-5 rounded-3xl bg-background p-4">
                            <TotalsRow
                                label="Estimated subtotal"
                                value={formatAmount(estimate.subtotal)}
                            />
                            {bookingFeeRate > 0 ? (
                                <TotalsRow
                                    label={
                                        estimate.bookingFeeIncluded
                                            ? "Booking fee (included)"
                                            : `Booking fee (${bookingFeeRate}%)`
                                    }
                                    value={
                                        estimate.bookingFeeIncluded
                                            ? "Included in total"
                                            : formatAmount(estimate.bookingFee, true)
                                    }
                                />
                            ) : null}
                            <div className="mt-4 border-t border-border/60 pt-4">
                                <TotalsRow
                                    label="Estimated total"
                                    value={formatAmount(
                                        estimate.total,
                                        bookingFeeRate > 0,
                                    )}
                                    prominent
                                />
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

function subscribeToCheckoutDraft(callback: () => void) {
    if (typeof window === "undefined") {
        return () => {};
    }

    const handleStorage = (event: StorageEvent) => {
        if (event.key) {
            callback();
        }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
        window.removeEventListener("storage", handleStorage);
    };
}

function InstructionCard({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-3xl border border-border/60 bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
        </div>
    );
}

function SummaryRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {label}
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
                {value}
            </p>
        </div>
    );
}

function TotalsRow({
    label,
    value,
    prominent = false,
}: {
    label: string;
    value: string;
    prominent?: boolean;
}) {
    return (
        <div className="mt-3 flex items-center justify-between gap-3 first:mt-0">
            <span
                className={
                    prominent
                        ? "text-sm font-semibold text-foreground"
                        : "text-sm text-muted"
                }
            >
                {label}
            </span>
            <span
                className={
                    prominent
                        ? "text-lg font-semibold text-foreground"
                        : "text-sm font-semibold text-foreground"
                }
            >
                {value}
            </span>
        </div>
    );
}

function SummaryBlock({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">
                {value}
            </p>
        </div>
    );
}
