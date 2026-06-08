import type { BookingStatus } from "@/features/bookings/types/bookings";
import { getBookingStatusLabel } from "@/features/bookings/utils/booking-status";

const badgeClasses: Record<BookingStatus, string> = {
    held: "border-pink-main/20 bg-pink-main/10 text-pink-main",
    requested: "border-pink-main/20 bg-pink-main/10 text-pink-main",
    confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
    cancellation_requested: "border-pink-main/20 bg-pink-main/10 text-pink-main",
    cancelled: "border-red-200 bg-red-50 text-red-700",
    rejected: "border-pink-main/20 bg-pink-main/10 text-pink-main",
    completed: "border-pink-main/20 bg-pink-main/10 text-pink-main",
    no_show: "border-pink-main/20 bg-pink-main/10 text-pink-main",
    expired: "border-pink-main/20 bg-pink-main/10 text-pink-main",
};

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClasses[status]}`}
        >
            {getBookingStatusLabel(status)}
        </span>
    );
}
