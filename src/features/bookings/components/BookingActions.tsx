"use client";

import Link from "next/link";
import { useState } from "react";
import { FiEdit3, FiEye, FiXCircle } from "react-icons/fi";
import CancellationRequestModal from "@/features/bookings/components/CancellationRequestModal";
import type { BookingSummary } from "@/features/bookings/types/bookings";
import { getBookingReferenceHref } from "@/features/bookings/utils/booking-formatters";
import {
    canEditBooking,
    canRequestCancellation,
} from "@/features/bookings/utils/booking-status";

export default function BookingActions({
    booking,
    compact = false,
    allowCancellation = true,
}: {
    booking: BookingSummary;
    compact?: boolean;
    allowCancellation?: boolean;
}) {
    const [isCancellationOpen, setIsCancellationOpen] = useState(false);

    return (
        <>
            <div
                className={
                    compact
                        ? "flex flex-col gap-1.5"
                        : "flex flex-col gap-2 sm:flex-row sm:flex-wrap"
                }
            >
                <Link
                    href={getBookingReferenceHref(booking.bookingReference)}
                    className={
                        compact
                            ? "inline-flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm font-semibold text-dark-green transition hover:text-pink-main"
                            : "btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
                    }
                >
                    <FiEye className="h-4 w-4" aria-hidden="true" />
                    View Details
                </Link>

                {canEditBooking(booking.status) ? (
                    <Link
                        href={getBookingReferenceHref(
                            booking.bookingReference,
                            "/edit",
                        )}
                        className={
                            compact
                                ? "inline-flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm font-semibold text-muted transition hover:text-foreground"
                                : "btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
                        }
                    >
                        <FiEdit3 className="h-4 w-4" aria-hidden="true" />
                        Edit Request
                    </Link>
                ) : null}

                {allowCancellation &&
                canRequestCancellation(
                    booking.status,
                    booking.cancellationRequest,
                ) ? (
                    <button
                        type="button"
                        className={
                            compact
                                ? "inline-flex items-center gap-2 rounded-lg px-1 py-1.5 text-left text-sm font-semibold text-muted transition hover:text-foreground"
                                : "btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
                        }
                        onClick={() => setIsCancellationOpen(true)}
                    >
                        <FiXCircle className="h-4 w-4" aria-hidden="true" />
                        Request Cancellation
                    </button>
                ) : null}

                {allowCancellation &&
                booking.status === "cancellation_requested" ? (
                    <button
                        type="button"
                        className={
                            compact
                                ? "inline-flex items-center rounded-lg px-1 py-1.5 text-left text-sm font-semibold text-muted"
                                : "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-muted"
                        }
                        disabled
                    >
                        Cancellation requested
                    </button>
                ) : null}
            </div>

            {isCancellationOpen ? (
                <CancellationRequestModal
                    booking={booking}
                    onClose={() => setIsCancellationOpen(false)}
                />
            ) : null}
        </>
    );
}
