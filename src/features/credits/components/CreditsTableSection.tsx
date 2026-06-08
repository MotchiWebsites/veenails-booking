"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { FiSearch } from "react-icons/fi";

import {
    getCreditReason,
    getCreditStatus,
    type CreditStatus,
} from "@/features/credits/lib/credits";
import type { CreditRecord } from "@/features/credits/data/credits";
import { formatCurrency } from "@/lib/utils/money";

const PAGE_SIZE = 8;

function formatFriendlyDate(value: string | null, fallback = "No expiry") {
    if (!value) {
        return fallback;
    }

    return new Intl.DateTimeFormat("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

function getStatusBadgeClasses(status: CreditStatus) {
    switch (status) {
        case "Available":
            return "bg-success-soft text-success";
        case "Used":
            return "bg-info-soft text-info";
        case "Expired":
            return "bg-warning-soft text-warning";
        case "Inactive":
            return "bg-surface-2 text-muted";
        default:
            return "bg-surface-2 text-muted";
    }
}

function getBookingLabel(credit: CreditRecord) {
    return credit.source_booking?.booking_reference || "—";
}

function getSecondaryDateLabel(section: "active" | "history", status: CreditStatus) {
    if (section === "active") {
        return "Expires";
    }

    return status === "Used" ? "Used" : "Expired";
}

function getSecondaryDateValue(section: "active" | "history", credit: CreditRecord) {
    if (section === "active") {
        return formatFriendlyDate(credit.expires_at);
    }

    const status = getCreditStatus(credit);

    return status === "Used"
        ? formatFriendlyDate(credit.used_at, "—")
        : formatFriendlyDate(credit.expires_at, "—");
}

function PaginationControls({
    currentPage,
    totalPages,
    onPrevious,
    onNext,
}: {
    currentPage: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
}) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 border-t border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
                Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={currentPage === 1}
                    className="btn-secondary min-w-24"
                >
                    Previous
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={currentPage === totalPages}
                    className="btn-secondary min-w-24"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default function CreditsTableSection({
    credits,
    section,
    emptyTitle,
    emptyDescription,
}: {
    credits: CreditRecord[];
    section: "active" | "history";
    emptyTitle: string;
    emptyDescription: string;
}) {
    const [query, setQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [, startTransition] = useTransition();
    const deferredQuery = useDeferredValue(query);

    const filteredCredits = useMemo(() => {
        const normalizedQuery = deferredQuery.trim().toLowerCase();

        if (!normalizedQuery) {
            return credits;
        }

        return credits.filter((credit) => {
            const status = getCreditStatus(credit);
            const searchValue = [
                status,
                getCreditReason(credit.reason),
                getBookingLabel(credit),
                formatCurrency(credit.amount, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }),
                formatFriendlyDate(credit.created_at, "Unknown"),
                getSecondaryDateValue(section, credit),
            ]
                .join(" ")
                .toLowerCase();

            return searchValue.includes(normalizedQuery);
        });
    }, [credits, deferredQuery, section]);

    const totalPages = Math.max(1, Math.ceil(filteredCredits.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedCredits = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return filteredCredits.slice(start, start + PAGE_SIZE);
    }, [filteredCredits, safePage]);

    const handleSearchChange = (value: string) => {
        startTransition(() => {
            setQuery(value);
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

    const searchPlaceholder =
        section === "active"
            ? "Search available credits"
            : "Search credit history";

    if (credits.length === 0) {
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
            <div className="border-b border-border/50 bg-surface px-4 py-3 sm:px-5 sm:py-3.5">
                <div>
                    <label className="block min-w-0">
                        <span className="text-sm font-semibold text-foreground">
                            Search credits
                        </span>

                        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <span className="relative block min-w-0 flex-1">
                                <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(event) => handleSearchChange(event.target.value)}
                                    placeholder={searchPlaceholder}
                                    aria-label="Search credits"
                                    className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 pl-10 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-sm placeholder:text-muted-2 focus:border-pink-300 focus:ring-2 focus:ring-ring"
                                />
                            </span>

                            <span className="flex items-center sm:self-center">
                                <span className="inline-flex min-w-24 items-center justify-center rounded-full border border-border/60 bg-background px-3 py-2 text-center text-xs font-medium leading-none text-muted">
                                    {filteredCredits.length} credit
                                    {filteredCredits.length === 1 ? "" : "s"}
                                </span>
                            </span>
                        </div>
                    </label>

                    <p className="mt-1.5 text-xs text-muted">
                        Search by reason, booking reference, amount, or date.
                    </p>
                </div>
            </div>

            {filteredCredits.length === 0 ? (
                <div className="p-6 text-center sm:p-8">
                    <h3 className="text-lg font-semibold text-foreground">
                        No matching credits
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                        Try searching by reason, booking reference, amount, or date.
                    </p>
                </div>
            ) : (
                <>
                    <div className="hidden md:block">
                        <table className="min-w-full table-fixed">
                            <thead className="bg-surface-2/60 text-left">
                                <tr className="text-sm text-muted">
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                    <th className="px-5 py-4 font-semibold">Amount</th>
                                    <th className="px-5 py-4 font-semibold">Reason</th>
                                    <th className="px-5 py-4 font-semibold">Created</th>
                                    <th className="px-5 py-4 font-semibold">
                                        {section === "active" ? "Expires" : "Used / Expired"}
                                    </th>
                                    <th className="px-5 py-4 font-semibold">Booking</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCredits.map((credit) => {
                                    const status = getCreditStatus(credit);

                                    return (
                                        <tr
                                            key={credit.id}
                                            className="border-t border-border/50 align-top"
                                        >
                                            <td className="px-5 py-4">
                                                <span
                                                    className={[
                                                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                                        getStatusBadgeClasses(status),
                                                    ].join(" ")}
                                                >
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-semibold text-foreground">
                                                {formatCurrency(credit.amount, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-foreground">
                                                {getCreditReason(credit.reason)}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-muted">
                                                {formatFriendlyDate(credit.created_at, "Unknown")}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-muted">
                                                {getSecondaryDateValue(section, credit)}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-muted">
                                                {getBookingLabel(credit)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-4 p-4 md:hidden">
                        {paginatedCredits.map((credit) => {
                            const status = getCreditStatus(credit);

                            return (
                                <article
                                    key={credit.id}
                                    className="rounded-3xl border border-border/50 bg-background p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-foreground">
                                                {formatCurrency(credit.amount, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                            <p className="mt-1 text-sm text-foreground">
                                                {getCreditReason(credit.reason)}
                                            </p>
                                        </div>

                                        <span
                                            className={[
                                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                                getStatusBadgeClasses(status),
                                            ].join(" ")}
                                        >
                                            {status}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl bg-surface p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                                Created
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-foreground">
                                                {formatFriendlyDate(credit.created_at, "Unknown")}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-surface p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                                {getSecondaryDateLabel(section, status)}
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-foreground">
                                                {getSecondaryDateValue(section, credit)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-surface p-3 sm:col-span-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                                Booking
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-foreground">
                                                {getBookingLabel(credit)}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <PaginationControls
                        currentPage={safePage}
                        totalPages={totalPages}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                    />
                </>
            )}
        </div>
    );
}
