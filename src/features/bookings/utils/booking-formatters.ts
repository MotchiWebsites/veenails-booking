import type { BookingSummary } from "@/features/bookings/types/bookings";

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit",
});

const moneyFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
});

export function formatBookingDateTime(startsAt: string | null, endsAt: string | null) {
    if (!startsAt) {
        return "Appointment time pending";
    }

    const startDate = new Date(startsAt);

    if (!endsAt) {
        return dateTimeFormatter.format(startDate);
    }

    const endDate = new Date(endsAt);

    return `${dateFormatter.format(startDate)} at ${timeFormatter.format(
        startDate,
    )}-${timeFormatter.format(endDate)}`;
}

export function formatBookingDate(startsAt: string | null) {
    if (!startsAt) {
        return "Appointment date pending";
    }

    return shortDateFormatter.format(new Date(startsAt));
}

export function formatMoney(amount: number) {
    return moneyFormatter.format(amount);
}

export function formatBookingPrice(amount: number, fallback = "Price pending") {
    return amount > 0 ? formatMoney(amount) : fallback;
}

export function formatBookingReference(reference: string) {
    return reference.startsWith("#") ? reference : `#${reference}`;
}

export function formatShortLineItems(lineItems: BookingSummary["lineItems"]) {
    if (lineItems.length === 0) {
        return "Services pending";
    }

    const labels = lineItems.slice(0, 2).map((item) => item.label);
    const remaining = lineItems.length - labels.length;

    return remaining > 0
        ? `${labels.join(", ")} +${remaining} more`
        : labels.join(", ");
}

export function getBookingTotalDisplay(booking: BookingSummary) {
    const isActive =
        booking.status === "held" ||
        booking.status === "requested" ||
        booking.status === "confirmed" ||
        booking.status === "cancellation_requested";

    if (isActive) {
        return {
            label: "Estimated total",
            value: formatBookingPrice(booking.estimatedTotal),
            amount: booking.estimatedTotal,
        };
    }

    const useFinalTotal =
        booking.status === "completed" && booking.finalTotal > 0;
    const amount = useFinalTotal
        ? booking.finalTotal
        : booking.finalTotal > 0
          ? booking.finalTotal
          : booking.estimatedTotal;

    return {
        label: useFinalTotal ? "Final total" : "Total",
        value: formatBookingPrice(amount),
        amount,
    };
}
