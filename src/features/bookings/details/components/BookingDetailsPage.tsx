import Link from "next/link";
import { FiArrowLeft, FiEdit3 } from "react-icons/fi";

import SummaryRow from "@/components/shared/ui/SummaryRow";
import TotalsRow from "@/components/shared/ui/TotalsRow";
import BookingStatusBadge from "@/features/bookings/components/BookingStatusBadge";
import BookingCancellationCard from "@/features/bookings/details/components/BookingCancellationCard";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import BookingInspoInstagramStep from "@/features/bookings/inspo/components/BookingInspoInstagramStep";
import { shouldShowBookingInspoSubmission } from "@/features/bookings/inspo/data/booking-inspo";
import {
    formatBookingDateTime,
    formatBookingReference,
    formatMoney,
    getBookingReferenceHref,
    getBookingTotalDisplay,
} from "@/features/bookings/utils/booking-formatters";
import {
    canShowClientArrivalInfo,
    canEditBookingOnline,
    isUpcomingBooking,
} from "@/features/bookings/utils/booking-status";
import {
    getBookingDiscounts,
    getBookingSubtotalBeforeDiscount,
} from "@/features/bookings/utils/booking-pricing";
import { calculateBookingLedger } from "@/features/bookings/utils/booking-ledger";
import BookingDetailsHeader from "./BookingDetailsHeader";
import { summaryRows } from "../data/summary-rows";
import BookingCancellationSummary from "@/features/bookings/details/components/BookingCancellationSummary";
import { normalizeBookingFeeRate } from "@/features/bookings/new-booking/utils";

export default function BookingDetailsPage({
    data,
}: {
    data: BookingDetailsData;
}) {
    const booking = data.summary;
    const totalDisplay = getBookingTotalDisplay(booking);
    const canEdit = canEditBookingOnline(booking.status, booking.startsAt);
    const discounts = getBookingDiscounts(booking);
    const subtotalBeforeDiscount = getBookingSubtotalBeforeDiscount(booking);
    const discountTotal = discounts.reduce(
        (total, discount) => total + discount.amount,
        0,
    );
    const discountedSubtotal = Math.max(
        0,
        subtotalBeforeDiscount - discountTotal,
    );
    const bookingFeeRate = normalizeBookingFeeRate(data.bookingFeeRate);
    const ledger = calculateBookingLedger({
        appointmentTotal: totalDisplay.amount,
        payments: data.payments.map((payment) => ({
            type: payment.type,
            status: payment.status,
            amount: payment.amount,
        })),
    });
    const creditUsed = ledger.creditApplied;
    const remainingBalance = ledger.amountDue;
    const showInspoAction =
        isUpcomingBooking(booking.status, booking.startsAt) &&
        shouldShowBookingInspoSubmission(data.inspoPrompt?.status);

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7 xl:p-8">
            <div className="flex flex-col gap-5 pb-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-green">
                        Booking reference
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-foreground">
                        {formatBookingReference(booking.bookingReference)}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        {formatBookingDateTime(
                            booking.startsAt,
                            booking.endsAt,
                        )}
                    </p>
                    <div className="mt-4">
                        <BookingStatusBadge status={booking.status} />
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
                    <Link
                        href="/booking"
                        className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                        <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to My Bookings
                    </Link>

                    {canEdit ? (
                        <Link
                            href={getBookingReferenceHref(
                                booking.bookingReference,
                                "/edit",
                            )}
                            className="btn-primary inline-flex items-center justify-center gap-2"
                        >
                            <FiEdit3 className="h-4 w-4" aria-hidden="true" />
                            Edit appointment
                        </Link>
                    ) : null}
                </div>
            </div>

            {booking.status === "rejected" ? (
                <div className="mb-2 rounded-3xl border border-border/60 bg-background p-5">
                    <p className="text-base font-semibold text-foreground">
                        Appointment not accepted
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        {data.rejectionReason ??
                            "The studio wasn’t able to accept this appointment request."}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        Please choose another available time or contact us if
                        you have questions.
                    </p>
                </div>
            ) : null}

            <BookingCancellationSummary data={data} />

            <div className="py-6">
                <BookingDetailsHeader title="Appointment summary" />
                {canShowClientArrivalInfo(booking.status) &&
                data.arrivalInfo ? (
                    <div className="mt-5 rounded-2xl border border-border/60 bg-surface-2 p-4">
                        <p className="text-sm font-semibold text-foreground">
                            Studio arrival information
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {data.arrivalInfo.address ? (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                        Address
                                    </p>
                                    <p className="mt-1 text-sm text-foreground">
                                        {data.arrivalInfo.address}
                                    </p>
                                </div>
                            ) : null}
                            {data.arrivalInfo.buzzerCode ? (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                        Buzzer code
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {data.arrivalInfo.buzzerCode}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                        <p className="mt-3 text-sm text-muted">
                            Please arrive 15 minutes early.
                        </p>
                    </div>
                ) : null}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {summaryRows(
                        booking,
                        totalDisplay,
                        remainingBalance,
                        creditUsed,
                        data,
                    ).map((row) => (
                        <SummaryRow
                            key={row.label}
                            label={row.label}
                            value={row.value}
                        />
                    ))}
                </div>

                {data.arrivalInfo ? (
                    <div className="mt-5 rounded-2xl border border-border/60 bg-surface-2 p-4">
                        <p className="text-sm font-semibold text-foreground">
                            Studio arrival information
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {data.arrivalInfo.address ? (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                        Address
                                    </p>
                                    <p className="mt-1 text-sm text-foreground">
                                        {data.arrivalInfo.address}
                                    </p>
                                </div>
                            ) : null}
                            {data.arrivalInfo.buzzerCode ? (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                                        Buzzer code
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {data.arrivalInfo.buzzerCode}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                        <p className="mt-3 text-sm text-muted">
                            Please arrive 15 minutes early.
                        </p>
                    </div>
                ) : null}

                {data.clientNotes ? (
                    <div className="mt-5 rounded-2xl bg-background p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                            Your notes
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground">
                            {data.clientNotes}
                        </p>
                    </div>
                ) : null}
            </div>

            <div className="py-6">
                <BookingDetailsHeader title="Services and pricing" />
                <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
                    <div className="space-y-3">
                        {booking.lineItems.some(
                            (item) => item.itemType !== "discount",
                        ) ? (
                            booking.lineItems
                                .filter((item) => item.itemType !== "discount")
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start justify-between gap-4 rounded-2xl bg-background p-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground">
                                                {item.label}
                                            </p>
                                            <p className="mt-1 text-xs text-muted">
                                                Qty {item.quantity}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold text-foreground">
                                            {formatMoney(item.lineTotal)}
                                        </p>
                                    </div>
                                ))
                        ) : (
                            <p className="rounded-2xl border border-dashed border-border/60 bg-background p-4 text-sm text-muted">
                                Service details are still being finalized.
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl bg-background p-4">
                        <TotalsRow
                            label="Subtotal"
                            value={formatMoney(subtotalBeforeDiscount)}
                        />
                        {discounts.map((discount) => (
                            <div key={discount.id}>
                                <TotalsRow
                                    label={discount.label}
                                    value={`-${formatMoney(discount.amount)}`}
                                />
                                {discount.reason ? (
                                    <p className="-mt-1 mb-2 text-xs text-muted">
                                        {discount.reason}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                        {discountTotal > 0 ? (
                            <TotalsRow
                                label="Discounted subtotal"
                                value={formatMoney(discountedSubtotal)}
                            />
                        ) : null}
                        <TotalsRow
                            label={
                                data.bookingFeeMode === "included_in_price"
                                    ? `Booking fee (${bookingFeeRate}% included)`
                                    : `Booking fee (${bookingFeeRate}%)`
                            }
                            value={
                                data.bookingFeeMode === "included_in_price"
                                    ? "Included"
                                    : `+${formatMoney(data.bookingFeeAmount)}`
                            }
                        />
                        <div className="mt-4 border-t border-border/60 pt-4">
                            <TotalsRow
                                label={totalDisplay.label}
                                value={totalDisplay.value}
                                prominent
                            />
                        </div>
                        {ledger.cashApplied > 0 ? (
                            <TotalsRow
                                label="Deposit/payments applied"
                                value={`-${formatMoney(ledger.cashApplied)}`}
                            />
                        ) : null}
                        {creditUsed > 0 ? (
                            <TotalsRow
                                label="Account credit applied"
                                value={`-${formatMoney(creditUsed)}`}
                            />
                        ) : null}
                        <div className="mt-4 border-t border-border/60 pt-4">
                            <TotalsRow
                                label="Amount to be charged"
                                value={formatMoney(remainingBalance)}
                                prominent
                            />
                        </div>
                        {ledger.overpayment > 0 ? (
                            <p className="mt-3 text-xs leading-relaxed text-muted">
                                {formatMoney(ledger.overpayment)} will be
                                returned as studio credit when this appointment
                                is completed.
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>

            {data.policies.length > 0 ? (
                <div className="py-6">
                    <BookingDetailsHeader title="Accepted Policies" />
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        {data.policies.map((policy) => (
                            <div
                                key={policy.id}
                                className="rounded-2xl bg-background p-4"
                            >
                                <p className="text-sm font-semibold text-foreground">
                                    {policy.title}
                                </p>
                                {policy.description ? (
                                    <p className="mt-2 text-sm leading-relaxed text-muted">
                                        {policy.description}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {showInspoAction ? (
                <div className="py-6">
                    <BookingDetailsHeader title="Design Inspo" />
                    <div className="mt-4">
                        <BookingInspoInstagramStep
                            bookingId={booking.id}
                            compact
                        />
                    </div>
                </div>
            ) : null}

            <div className="pt-6">
                <BookingDetailsHeader title="Request Cancellation" />
                <div className="mt-4">
                    <BookingCancellationCard data={data} variant="section" />
                </div>
            </div>
        </section>
    );
}
