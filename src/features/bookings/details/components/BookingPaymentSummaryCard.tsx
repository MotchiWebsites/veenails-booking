import { FiCreditCard } from "react-icons/fi";

import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import TotalsRow from "@/components/shared/ui/TotalsRow";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import { formatMoney } from "@/features/bookings/utils/booking-formatters";
import {
    getBookingDiscounts,
    getBookingSubtotalBeforeDiscount,
} from "@/features/bookings/utils/booking-pricing";
import { calculateBookingLedger } from "@/features/bookings/utils/booking-ledger";
import { normalizeBookingFeeRate } from "@/features/bookings/new-booking/utils";

function formatPaymentLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export default function BookingPaymentSummaryCard({
    data,
}: {
    data: BookingDetailsData;
}) {
    const displayTotal =
        data.summary.status === "completed" && data.summary.finalTotal > 0
            ? data.summary.finalTotal
            : data.summary.estimatedTotal;
    const discounts = getBookingDiscounts(data.summary);
    const discountTotal = discounts.reduce(
        (total, discount) => total + discount.amount,
        0,
    );
    const discountedSubtotal = Math.max(
        0,
        getBookingSubtotalBeforeDiscount(data.summary) - discountTotal,
    );
    const ledger = calculateBookingLedger({
        appointmentTotal: displayTotal,
        payments: data.payments.map((payment) => ({
            type: payment.type,
            status: payment.status,
            amount: payment.amount,
        })),
    });
    const bookingFeeRate = normalizeBookingFeeRate(data.bookingFeeRate);

    return (
        <StepSectionCard
            icon={<FiCreditCard className="h-5 w-5" aria-hidden="true" />}
            title="Payment summary"
            description="Deposit, credit, and payment activity for this booking."
        >
            <div className="rounded-3xl border border-border/60 bg-background p-4">
                <TotalsRow
                    label="Subtotal"
                    value={formatMoney(
                        getBookingSubtotalBeforeDiscount(data.summary),
                    )}
                />
                {discounts.map((discount) => (
                    <TotalsRow
                        key={discount.id}
                        label={discount.label}
                        value={`-${formatMoney(discount.amount)}`}
                    />
                ))}
                {discountTotal > 0 ? (
                    <TotalsRow
                        label="Discounted subtotal"
                        value={formatMoney(discountedSubtotal)}
                    />
                ) : null}
                {data.bookingFeeMode === "added_on_top" &&
                bookingFeeRate > 0 ? (
                    <TotalsRow
                        label={`Booking fee (${bookingFeeRate}%)`}
                        value={`+${formatMoney(data.bookingFeeAmount)}`}
                    />
                ) : null}
                <div className="mt-4 border-t border-border/60 pt-4">
                    <TotalsRow
                        label={
                            data.summary.status === "completed"
                                ? "Final total"
                                : "Estimated total"
                        }
                        value={formatMoney(displayTotal)}
                        prominent
                    />
                    <TotalsRow
                        label="Remaining balance"
                        value={formatMoney(Math.max(0, data.amountDue))}
                        prominent
                    />
                </div>
                {ledger.cashApplied > 0 ? (
                    <TotalsRow
                        label="Deposit/payments applied"
                        value={`-${formatMoney(ledger.cashApplied)}`}
                    />
                ) : null}
                {ledger.creditApplied > 0 ? (
                    <TotalsRow
                        label="Account credit applied"
                        value={`-${formatMoney(ledger.creditApplied)}`}
                    />
                ) : null}
                <div className="mt-4 border-t border-border/60 pt-4">
                    <TotalsRow
                        label="Amount to be charged"
                        value={formatMoney(ledger.amountDue)}
                        prominent
                    />
                </div>
                {ledger.overpayment > 0 ? (
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                        {formatMoney(ledger.overpayment)} will be returned as
                        studio credit when this appointment is completed.
                    </p>
                ) : null}
            </div>

            {data.payments.length > 0 ? (
                <div className="mt-4 space-y-3">
                    {data.payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="rounded-3xl border border-border/60 bg-background p-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {formatPaymentLabel(payment.type)}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        {formatPaymentLabel(payment.method)} ·{" "}
                                        {formatPaymentLabel(payment.status)}
                                    </p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {formatMoney(payment.amount)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-4 rounded-3xl border border-dashed border-border/60 bg-background p-4 text-sm text-muted">
                    No payment activity is listed yet.
                </p>
            )}
        </StepSectionCard>
    );
}
