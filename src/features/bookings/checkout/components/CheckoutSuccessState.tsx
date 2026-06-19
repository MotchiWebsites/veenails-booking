import Link from "next/link";
import { FiCheckCircle } from "react-icons/fi";
import SummaryBlock from "@/components/shared/ui/SummaryBlock";
import BookingInspoInstagramStep from "@/features/bookings/inspo/components/BookingInspoInstagramStep";
import { formatAmount } from "@/features/bookings/checkout/utils/checkout-formatters";
import {
    formatSlotDate,
    formatSlotTimeRange,
} from "@/features/bookings/new-booking/utils";

export default function CheckoutSuccessState({
    bookingId,
    bookingReference,
    startsAt,
    endsAt,
    depositAmount,
}: {
    bookingId: string;
    bookingReference: string;
    startsAt: string;
    endsAt: string;
    depositAmount: number;
}) {
    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm sm:p-8">
            <div className="mx-auto max-w-3xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-success">
                    <FiCheckCircle className="h-8 w-8" aria-hidden="true" />
                </div>

                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-dark-green">
                    Successfully Sent
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Booking Request Sent
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                    Your appointment request has been received and your deposit
                    is marked as sent. The studio will match your e-Transfer
                    using the message/note provided at checkout.
                </p>

                <div className="mt-8 grid gap-4 rounded-3xl bg-background p-5 text-left sm:p-6">
                    <SummaryBlock
                        label="Booking reference"
                        value={bookingReference}
                    />
                    <SummaryBlock
                        label="Date & Time"
                        value={`${formatSlotDate(startsAt)} · ${formatSlotTimeRange(
                            {
                                id: "confirmed-slot",
                                startsAt,
                                endsAt,
                            },
                        )}`}
                    />
                    <SummaryBlock
                        label="Deposit"
                        value={formatAmount(depositAmount, true)}
                    />
                </div>

                <div className="mt-8 text-left">
                    <BookingInspoInstagramStep bookingId={bookingId} />
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
