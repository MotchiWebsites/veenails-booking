"use client";

import SummaryRow from "@/components/shared/ui/SummaryRow";
import TotalsRow from "@/components/shared/ui/TotalsRow";
import { formatEstimateAmount } from "@/features/bookings/new-booking/utils/booking-flow-formatters";

type BookingSummaryCardProps = {
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
    compact?: boolean;
};

export default function BookingSummaryCard({
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
    compact = false,
}: BookingSummaryCardProps) {
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
                    <SummaryRow
                        key={row.label}
                        label={row.label}
                        value={row.value}
                    />
                ))}
            </div>

            <div className="mt-5 rounded-3xl bg-surface p-4">
                <TotalsRow
                    label="Estimated subtotal"
                    value={formatEstimateAmount(subtotal)}
                />

                {bookingFeeRate > 0 ? (
                    <TotalsRow
                        label={
                            bookingFeeIncluded
                                ? "Booking fee (included)"
                                : `Booking fee (${bookingFeeRate}%)`
                        }
                        value={
                            bookingFeeIncluded
                                ? "Included in total"
                                : formatEstimateAmount(bookingFee, true)
                        }
                    />
                ) : null}

                <div className="mt-4 border-t border-border/60 pt-4">
                    <TotalsRow
                        label="Total estimate"
                        value={formatEstimateAmount(total, bookingFeeRate > 0)}
                        prominent
                    />
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
