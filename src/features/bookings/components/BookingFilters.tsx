import { FiSearch } from "react-icons/fi";
import {
    bookingStatusFilterValues,
    getBookingStatusLabel,
} from "@/features/bookings/utils/booking-status";
import type { BookingStatusFilter } from "@/features/bookings/types/bookings";

export default function BookingFilters({
    search,
    status,
}: {
    search: string;
    status: BookingStatusFilter;
}) {
    return (
        <form className="rounded-3xl border border-border/60 bg-surface p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
                <label className="block">
                    <span className="text-sm font-semibold text-foreground">
                        Search
                    </span>
                    <div className="relative mt-2">
                        <FiSearch
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                            aria-hidden="true"
                        />
                        <input
                            name="q"
                            type="search"
                            defaultValue={search}
                            placeholder="Reference, status, notes, services"
                            className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-pink-main focus:ring-2 focus:ring-pink-main/20"
                        />
                    </div>
                </label>

                <label className="block">
                    <span className="text-sm font-semibold text-foreground">
                        Status
                    </span>
                    <select
                        name="status"
                        defaultValue={status}
                        className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-pink-main focus:ring-2 focus:ring-pink-main/20"
                    >
                        {bookingStatusFilterValues.map((value) => (
                            <option key={value} value={value}>
                                {value === "all"
                                    ? "All statuses"
                                    : getBookingStatusLabel(value)}
                            </option>
                        ))}
                    </select>
                </label>

                <input type="hidden" name="page" value="1" />

                <button type="submit" className="btn-primary md:min-h-12">
                    Apply
                </button>
            </div>
        </form>
    );
}
