import {
    formatBookingDateTime,
    formatMoney,
} from "@/features/bookings/utils/booking-formatters";

export { formatBookingDateTime, formatMoney };

export function formatDateTime(value: string | null | undefined) {
    if (!value) return "Not set";

    return new Intl.DateTimeFormat("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

export function formatContactMethod(value: string | null | undefined) {
    if (value === "instagram") return "Instagram";
    if (value === "phone") return "Phone";
    return "Email";
}
