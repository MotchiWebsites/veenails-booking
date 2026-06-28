"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { FiSearch, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { FaSort } from "react-icons/fa";

import AppSelect from "@/components/shared/form/AppSelect";
import BookingActions from "@/features/bookings/components/BookingActions";
import BookingStatusBadge from "@/features/bookings/components/BookingStatusBadge";
import {
    bookingStatusFilterValues,
    getBookingStatusLabel,
    getDepositStatusLabel,
} from "@/features/bookings/utils/booking-status";
import {
    formatBookingDate,
    formatBookingReference,
    formatMoney,
    formatShortLineItems,
    getBookingTotalDisplay,
} from "@/features/bookings/utils/booking-formatters";
import type {
    BookingStatusFilter,
    BookingSummary,
} from "@/features/bookings/types/bookings";
import { getBookingDiscounts } from "@/features/bookings/utils/booking-pricing";

type SortKey = "status" | "booking" | "appointment" | "total";
type SortDirection = "asc" | "desc";

const statusSortOrder = [
    "confirmed",
    "requested",
    "cancellation_requested",
    "completed",
    "cancelled",
    "rejected",
    "no_show",
    "expired",
    "held",
];

function SortButton({
    label,
    sortKey,
    activeSortKey,
    direction,
    onSort,
}: {
    label: string;
    sortKey: SortKey;
    activeSortKey: SortKey;
    direction: SortDirection;
    onSort: (key: SortKey) => void;
}) {
    const isActive = activeSortKey === sortKey;

    // Choose an icon: use filter when not active, otherwise chevron up/down
    const Icon = isActive
        ? direction === "asc"
            ? FiChevronUp
            : FiChevronDown
        : FaSort;

    return (
        <button
            type="button"
            onClick={() => onSort(sortKey)}
            className={[
                "inline-flex items-center gap-2 rounded-md py-1 text-left transition",
                isActive
                    ? "text-foreground font-semibold"
                    : "text-muted hover:text-foreground",
            ].join(" ")}
            aria-label={`Sort by ${label}${isActive ? ` (${direction})` : ""}`}
            aria-pressed={isActive}
        >
            <span>{label}</span>

            <span className="flex items-center" aria-hidden="true">
                <Icon
                    className={
                        isActive
                            ? "h-4 w-4 text-pink-main"
                            : "h-4 w-4 text-muted"
                    }
                />
            </span>

            <span className="sr-only">
                {isActive
                    ? direction === "asc"
                        ? "sorted ascending"
                        : "sorted descending"
                    : "not sorted"}
            </span>
        </button>
    );
}

function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    visibleCount,
    onPrevious,
    onNext,
}: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    visibleCount: number;
    onPrevious: () => void;
    onNext: () => void;
}) {
    const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const lastItem = totalItems === 0 ? 0 : firstItem + visibleCount - 1;

    return (
        <div className="flex flex-col gap-3 border-t border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
                Showing {firstItem}-{lastItem} of {totalItems}
            </p>

            <div className="flex items-center gap-3">
                <p className="hidden text-sm text-muted sm:block">
                    Page {currentPage} of {totalPages}
                </p>
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={currentPage === 1}
                    className="btn-secondary min-w-24 disabled:pointer-events-none disabled:opacity-60"
                >
                    Previous
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={currentPage === totalPages}
                    className="btn-secondary min-w-24 disabled:pointer-events-none disabled:opacity-60"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function BookingMobileCard({ booking }: { booking: BookingSummary }) {
    const total = getBookingTotalDisplay(booking);
    const discounts = getBookingDiscounts(booking);

    return (
        <article className="rounded-2xl border border-border/60 bg-background p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-dark-green">
                        {formatBookingReference(booking.bookingReference)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                        {formatBookingDate(booking.startsAt)}
                    </p>
                </div>

                <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                    <span className="text-muted">Services</span>
                    <span className="max-w-52 text-right font-medium text-foreground">
                        {formatShortLineItems(booking.lineItems)}
                    </span>
                </div>

                <div className="flex justify-between gap-4">
                    <span className="text-muted">{total.label}</span>
                    <span className="text-right font-semibold text-foreground">
                        {total.value}
                    </span>
                </div>
                {discounts.map((discount) => (
                    <div
                        key={discount.id}
                        className="flex justify-between gap-4 text-xs"
                    >
                        <span className="text-muted">{discount.label}</span>
                        <span className="font-semibold text-dark-green">
                            -{formatMoney(discount.amount)}
                        </span>
                    </div>
                ))}
            </div>

            {booking.cancellationRequest ? (
                <p className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-muted">
                    Cancellation request:{" "}
                    <span className="font-semibold capitalize text-foreground">
                        {booking.cancellationRequest.status.replace("_", " ")}
                    </span>
                </p>
            ) : null}

            <div className="mt-4 border-t border-border/60 pt-4">
                <BookingActions booking={booking} />
            </div>
        </article>
    );
}

export default function BookingTableSection({
    bookings,
    initialSearch,
    initialStatus,
    pageSize = 8,
    emptyTitle,
    emptyDescription,
}: {
    bookings: BookingSummary[];
    initialSearch: string;
    initialStatus: BookingStatusFilter;
    pageSize?: number;
    emptyTitle: string;
    emptyDescription: string;
}) {
    const [query, setQuery] = useState(initialSearch);
    const [status, setStatus] = useState<BookingStatusFilter>(initialStatus);
    const [sortKey, setSortKey] = useState<SortKey>("status");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [, startTransition] = useTransition();
    const deferredQuery = useDeferredValue(query);
    const deferredStatus = useDeferredValue(status);

    const filteredBookings = useMemo(() => {
        const normalizedQuery = deferredQuery.trim().toLowerCase();

        return bookings.filter((booking) => {
            if (deferredStatus !== "all" && booking.status !== deferredStatus) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            const total = getBookingTotalDisplay(booking);
            const searchValue = [
                booking.bookingReference,
                getBookingStatusLabel(booking.status),
                getDepositStatusLabel(booking.depositStatus),
                formatBookingDate(booking.startsAt),
                formatShortLineItems(booking.lineItems),
                total.label,
                total.value,
                ...booking.lineItems.map((item) => item.label),
            ]
                .join(" ")
                .toLowerCase();

            return searchValue.includes(normalizedQuery);
        });
    }, [bookings, deferredQuery, deferredStatus]);

    const sortedBookings = useMemo(() => {
        const directionMultiplier = sortDirection === "asc" ? 1 : -1;

        return filteredBookings.slice().sort((a, b) => {
            if (sortKey === "status") {
                return (
                    (statusSortOrder.indexOf(a.status) -
                        statusSortOrder.indexOf(b.status)) *
                    directionMultiplier
                );
            }

            if (sortKey === "booking") {
                return (
                    a.bookingReference.localeCompare(b.bookingReference) *
                    directionMultiplier
                );
            }

            if (sortKey === "appointment") {
                const aTime = a.startsAt ? new Date(a.startsAt).getTime() : 0;
                const bTime = b.startsAt ? new Date(b.startsAt).getTime() : 0;
                return (aTime - bTime) * directionMultiplier;
            }

            const aTotal = getBookingTotalDisplay(a).amount;
            const bTotal = getBookingTotalDisplay(b).amount;
            return (aTotal - bTotal) * directionMultiplier;
        });
    }, [filteredBookings, sortDirection, sortKey]);

    const totalPages = Math.max(1, Math.ceil(sortedBookings.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedBookings = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return sortedBookings.slice(start, start + pageSize);
    }, [pageSize, safePage, sortedBookings]);

    const handleSearchChange = (value: string) => {
        startTransition(() => {
            setQuery(value);
            setCurrentPage(1);
        });
    };

    const handleStatusChange = (value: BookingStatusFilter) => {
        startTransition(() => {
            setStatus(value);
            setCurrentPage(1);
        });
    };

    const handleSort = (key: SortKey) => {
        startTransition(() => {
            if (sortKey === key) {
                setSortDirection((currentDirection) =>
                    currentDirection === "asc" ? "desc" : "asc",
                );
            } else {
                setSortKey(key);
                setSortDirection("asc");
            }
            setCurrentPage(1);
        });
    };

    const handlePrevious = () => {
        startTransition(() => {
            setCurrentPage((page) => Math.max(1, page - 1));
        });
    };

    const handleNext = () => {
        startTransition(() => {
            setCurrentPage((page) => Math.min(totalPages, page + 1));
        });
    };

    if (bookings.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-border/70 bg-surface p-6 text-center shadow-sm sm:p-8">
                <h3 className="text-lg font-semibold text-foreground">
                    {emptyTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    {emptyDescription}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
            <div className="border-b border-border/50 bg-background/60 px-4 py-4 sm:px-5">
                <div className="grid gap-3 lg:grid-cols-[1fr_220px] lg:items-end">
                    <label className="block min-w-0">
                        <span className="text-sm font-semibold text-foreground">
                            Search bookings
                        </span>

                        <span className="relative mt-1.5 block min-w-0">
                            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                            <input
                                type="search"
                                value={query}
                                onChange={(event) =>
                                    handleSearchChange(event.target.value)
                                }
                                placeholder="Reference, status, service, date, or total"
                                aria-label="Search bookings"
                                className="w-full rounded-xl border border-border/70 bg-surface px-3 py-2.5 pl-10 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-sm placeholder:text-muted-2 focus:border-pink-300 focus:ring-2 focus:ring-ring"
                            />
                        </span>
                    </label>

                    <AppSelect
                        label="Status"
                        value={status}
                        onChange={(value) =>
                            handleStatusChange(value as BookingStatusFilter)
                        }
                        options={bookingStatusFilterValues.map((value) => ({
                            value,
                            label:
                                value === "all"
                                    ? "All statuses"
                                    : getBookingStatusLabel(value),
                        }))}
                    />
                </div>
            </div>

            {filteredBookings.length === 0 ? (
                <div className="p-6 text-center sm:p-8">
                    <h3 className="text-lg font-semibold text-foreground">
                        No matching bookings
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                        Try a different search term or choose another status.
                    </p>
                </div>
            ) : (
                <>
                    <div className="hidden xl:block">
                        <table className="min-w-full table-fixed">
                            <thead className="bg-background/70 text-left">
                                <tr className="text-xs uppercase text-muted">
                                    <th className="w-36 px-5 py-3 font-semibold">
                                        <SortButton
                                            label="Status"
                                            sortKey="status"
                                            activeSortKey={sortKey}
                                            direction={sortDirection}
                                            onSort={handleSort}
                                        />
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        <SortButton
                                            label="Booking"
                                            sortKey="booking"
                                            activeSortKey={sortKey}
                                            direction={sortDirection}
                                            onSort={handleSort}
                                        />
                                    </th>
                                    <th className="w-40 px-5 py-3 font-semibold">
                                        <SortButton
                                            label="Appointment"
                                            sortKey="appointment"
                                            activeSortKey={sortKey}
                                            direction={sortDirection}
                                            onSort={handleSort}
                                        />
                                    </th>
                                    <th className="w-40 px-5 py-3 font-semibold">
                                        <SortButton
                                            label="Total"
                                            sortKey="total"
                                            activeSortKey={sortKey}
                                            direction={sortDirection}
                                            onSort={handleSort}
                                        />
                                    </th>
                                    <th className="w-44 px-5 py-3 font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBookings.map((booking) => {
                                    const total =
                                        getBookingTotalDisplay(booking);
                                    const discounts =
                                        getBookingDiscounts(booking);

                                    return (
                                        <tr
                                            key={booking.id}
                                            className="border-t border-border/50 align-top transition-colors hover:bg-background/60"
                                        >
                                            <td className="px-5 py-4">
                                                <BookingStatusBadge
                                                    status={booking.status}
                                                />
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {formatBookingReference(
                                                        booking.bookingReference,
                                                    )}
                                                </p>
                                                <p className="mt-1 text-sm text-foreground">
                                                    {formatShortLineItems(
                                                        booking.lineItems,
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-muted">
                                                {formatBookingDate(
                                                    booking.startsAt,
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {total.value}
                                                </p>
                                                <p className="mt-1 text-xs text-muted">
                                                    {total.label}
                                                </p>
                                                {discounts.map((discount) => (
                                                    <p
                                                        key={discount.id}
                                                        className="mt-1 text-xs font-semibold text-dark-green"
                                                    >
                                                        {discount.label}: -
                                                        {formatMoney(
                                                            discount.amount,
                                                        )}
                                                    </p>
                                                ))}
                                            </td>
                                            <td className="px-5 py-4">
                                                <BookingActions
                                                    booking={booking}
                                                    allowCancellation={false}
                                                    compact
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-3 p-4 xl:hidden">
                        {paginatedBookings.map((booking) => (
                            <BookingMobileCard
                                key={booking.id}
                                booking={booking}
                            />
                        ))}
                    </div>

                    <PaginationControls
                        currentPage={safePage}
                        totalPages={totalPages}
                        totalItems={sortedBookings.length}
                        pageSize={pageSize}
                        visibleCount={paginatedBookings.length}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                    />
                </>
            )}
        </div>
    );
}
