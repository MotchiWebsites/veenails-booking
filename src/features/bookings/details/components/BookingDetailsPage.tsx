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
    canEditBookingOnline,
    isUpcomingBooking,
} from "@/features/bookings/utils/booking-status";
import BookingDetailsHeader from "./BookingDetailsHeader";
import { summaryRows } from "../data/summary-rows";
import BookingCancellationSummary from "@/features/bookings/details/components/BookingCancellationSummary";

export default function BookingDetailsPage({
    data,
}: {
    data: BookingDetailsData;
}) {
    const booking = data.summary;
    const totalDisplay = getBookingTotalDisplay(booking);
    const canEdit = canEditBookingOnline(booking.status, booking.startsAt);
    const creditUsed = data.payments
        .filter((payment) => payment.type === "credit")
        .reduce((total, payment) => total + payment.amount, 0);

    const estimatedAmountDue = data.amountDue - data.depositAmount;
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

            <BookingCancellationSummary data={data} />

            <div className="py-6">
                <BookingDetailsHeader title="Appointment summary" />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {summaryRows(
                        booking,
                        totalDisplay,
                        estimatedAmountDue,
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
                        {booking.lineItems.length > 0 ? (
                            booking.lineItems.map((item) => (
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
                            label="Services subtotal"
                            value={formatMoney(data.subtotalAmount)}
                        />
                        <TotalsRow
                            label="Booking fee"
                            value={formatMoney(data.bookingFeeAmount)}
                        />
                        <TotalsRow
                            label="Deposit"
                            value={formatMoney(data.depositAmount * -1)}
                        />
                        {creditUsed > 0 && (
                            <TotalsRow
                                label="Credits used"
                                value={formatMoney(creditUsed * -1)}
                            />
                        )}
                        <div className="mt-4 border-t border-border/60 pt-4">
                            <TotalsRow
                                label={totalDisplay.label}
                                value={totalDisplay.value}
                                prominent
                            />
                            <TotalsRow
                                label="Estimated amount due at appointment"
                                value={formatMoney(estimatedAmountDue)}
                                prominent
                            />
                        </div>
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
