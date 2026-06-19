"use client";

import BookingSummaryCard from "@/features/bookings/new-booking/components/summary/BookingSummaryCard";
import type {
    AvailableAppointmentSlot,
    BookingEstimate,
    DesignTier,
    RemovalOption,
    ServiceConfig,
    ServiceOption,
} from "@/features/bookings/new-booking/types";
import {
    formatSlotShortDate,
    formatSlotTimeRange,
} from "@/features/bookings/new-booking/utils";

type BookingSummary = {
    slot: AvailableAppointmentSlot | null;
    removal: RemovalOption | null;
    service: ServiceConfig | null;
    serviceOption: ServiceOption | null;
    designTier: DesignTier | null;
};

type ReviewStepProps = {
    summary: BookingSummary;
    estimate: BookingEstimate;
    selectedServiceOptionLabel: string | null;
    depositNote: string | null;
    holdNote: string | null;
    bookingFeeRate: number;
    reviewReady: boolean;
};

export default function ReviewStep({
    summary,
    estimate,
    selectedServiceOptionLabel,
    depositNote,
    holdNote,
    bookingFeeRate,
    reviewReady,
}: ReviewStepProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Review your appointment
                </h2>
                <p className="text-sm leading-relaxed text-muted sm:text-base">
                    Double-check your estimated total before moving into
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
                removalLabel={estimate.removal?.summaryLabel ?? null}
                serviceLabel={estimate.service?.label ?? null}
                serviceOptionLabel={selectedServiceOptionLabel}
                designTierLabel={estimate.designTier?.label ?? null}
                subtotal={estimate.subtotal}
                bookingFee={estimate.bookingFee}
                bookingFeeIncluded={estimate.bookingFeeIncluded}
                bookingFeeRate={bookingFeeRate}
                depositNote={depositNote}
                holdNote={holdNote}
                total={estimate.total}
            />

            {reviewReady ? (
                <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-relaxed text-success">
                    Your appointment is ready for checkout. Use the button below
                    to continue.
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-border bg-background p-4 text-sm leading-relaxed text-muted">
                    Finish each required step before continuing to checkout.
                </div>
            )}
        </div>
    );
}
