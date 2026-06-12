import SummaryRow from "@/components/shared/ui/SummaryRow";
import TotalsRow from "@/components/shared/ui/TotalsRow";
import Link from "next/link";
import { formatAmount } from "@/features/bookings/checkout/utils/checkout-formatters";
import type { BookingEstimate } from "@/features/bookings/new-booking/types";
import type { BookingCheckoutDraft } from "@/lib/booking/checkout-draft";
import {
    formatSlotDate,
    formatSlotTimeRange,
} from "@/features/bookings/new-booking/utils";
import type {
    AvailableAppointmentSlot,
    RemovalOption,
    ServiceConfig,
} from "@/features/bookings/new-booking/types";

export default function CheckoutSummaryCard({
    draft,
    slot,
    estimate,
    removal,
    service,
    serviceOptionLabel,
    bookingFeeRate,
    creditAmount,
    totalAfterCredit,
    editHref,
}: {
    draft: BookingCheckoutDraft;
    slot: AvailableAppointmentSlot;
    estimate: BookingEstimate;
    removal: RemovalOption | null;
    service: ServiceConfig | null;
    serviceOptionLabel: string | null;
    bookingFeeRate: number;
    creditAmount: number;
    totalAfterCredit: number;
    editHref: string;
}) {
    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-foreground">
                Appointment Summary
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
                Review the appointment details and estimated pricing before
                sending your request.
            </p>
            <Link
                href={editHref}
                className="btn-secondary mt-4 inline-flex items-center justify-center"
            >
                Edit appointment
            </Link>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SummaryRow label="Date" value={formatSlotDate(slot.startsAt)} />
                <SummaryRow label="Time" value={formatSlotTimeRange(slot)} />
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
                        value={formatAmount(estimate.total, bookingFeeRate > 0)}
                        prominent
                    />
                </div>
                {creditAmount > 0 ? (
                    <div className="mt-4 border-t border-border/60 pt-4">
                        <TotalsRow
                            label="Credit applied"
                            value={`-${formatAmount(creditAmount, true)}`}
                        />
                        <TotalsRow
                            label="Estimated remaining total"
                            value={formatAmount(totalAfterCredit, true)}
                            prominent
                        />
                    </div>
                ) : null}
            </div>
        </section>
    );
}
