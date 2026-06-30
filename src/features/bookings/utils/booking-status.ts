import type {
    BookingSummary,
    BookingStatus,
    BookingStatusFilter,
    DepositStatus,
} from "@/features/bookings/types/bookings";

export const activeBookingStatuses: readonly BookingStatus[] = [
    "held",
    "requested",
    "confirmed",
    "cancellation_requested",
] as const;

export const pastBookingStatuses: readonly BookingStatus[] = [
    "cancelled",
    "rejected",
    "completed",
    "no_show",
    "expired",
] as const;

export const bookingStatusFilterValues = [
    "all",
    "requested",
    "confirmed",
    "cancellation_requested",
    "completed",
    "cancelled",
    "rejected",
    "no_show",
    "expired",
] as const satisfies BookingStatusFilter[];

const bookingStatusLabels: Record<BookingStatus, string> = {
    held: "Held",
    requested: "Requested",
    confirmed: "Confirmed",
    cancellation_requested: "Cancellation Requested",
    cancelled: "Cancelled",
    rejected: "Rejected",
    completed: "Completed",
    no_show: "No Show",
    expired: "Expired",
};

const depositStatusLabels: Record<DepositStatus, string> = {
    pending: "Deposit Pending",
    marked_sent: "Deposit Marked Sent",
    received: "Deposit Received",
    rejected: "Deposit Rejected",
    refunded: "Deposit Refunded",
    credited: "Deposit Credited",
    forfeited: "Deposit Forfeited",
};

export function getBookingStatusLabel(status: BookingStatus) {
    return bookingStatusLabels[status];
}

export function getDepositStatusLabel(status: DepositStatus) {
    return depositStatusLabels[status];
}

export function isUpcomingBooking(
    status: BookingStatus,
    startsAt?: string | null,
) {
    if (!activeBookingStatuses.includes(status)) {
        return false;
    }

    if (!startsAt) {
        return true;
    }

    return new Date(startsAt).getTime() > Date.now();
}

export function isPastBooking(status: BookingStatus, startsAt?: string | null) {
    if (pastBookingStatuses.includes(status)) {
        return true;
    }

    return Boolean(startsAt && new Date(startsAt).getTime() <= Date.now());
}

export function canRequestCancellation(
    status: BookingStatus,
    cancellationRequest?: BookingSummary["cancellationRequest"],
) {
    if (cancellationRequest?.status === "pending") {
        return false;
    }

    return status === "requested" || status === "confirmed";
}

export function canEditBooking(status: BookingStatus) {
    return (
        status === "held" || status === "requested" || status === "confirmed"
    );
}

export function isWithinEditCutoff(startsAt?: string | null, now = new Date()) {
    if (!startsAt) {
        return true;
    }

    return new Date(startsAt).getTime() - now.getTime() < 24 * 60 * 60 * 1000;
}

export function canEditBookingOnline(
    status: BookingStatus,
    startsAt?: string | null,
    now = new Date(),
) {
    return canEditBooking(status) && !isWithinEditCutoff(startsAt, now);
}
