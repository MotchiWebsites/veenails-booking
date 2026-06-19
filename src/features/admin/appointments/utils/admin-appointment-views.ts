import type { AdminAppointmentListItem } from "@/features/admin/appointments/data/admin-appointments";

export const adminAppointmentViews = {
    upcoming_confirmed: {
        label: "Upcoming confirmed",
        description: "Confirmed appointments scheduled for the future.",
    },
    pending_requests: {
        label: "Pending requests",
        description: "Upcoming booking requests waiting for confirmation.",
    },
    pending_cancellations: {
        label: "Pending cancellations",
        description: "Cancellation requests waiting for an admin decision.",
    },
    inspo_reviews: {
        label: "Inspo to review",
        description: "Design inspiration marked as sent and ready to review.",
    },
} as const;

export type AdminAppointmentView = keyof typeof adminAppointmentViews;

export function isAdminAppointmentView(
    value: string,
): value is AdminAppointmentView {
    return Object.hasOwn(adminAppointmentViews, value);
}

export function matchesAdminAppointmentView(
    booking: AdminAppointmentListItem,
    view: AdminAppointmentView,
    now: number,
) {
    const startsAt = booking.startsAt
        ? new Date(booking.startsAt).getTime()
        : null;
    const endsAt = booking.endsAt ? new Date(booking.endsAt).getTime() : null;

    if (view === "upcoming_confirmed") {
        return (
            booking.status === "confirmed" &&
            startsAt !== null &&
            startsAt >= now
        );
    }

    if (view === "pending_requests") {
        return (
            booking.status === "requested" &&
            (endsAt === null || endsAt >= now)
        );
    }

    if (view === "pending_cancellations") {
        return booking.latestCancellationStatus === "pending";
    }

    return booking.inspoStatus === "sent";
}
