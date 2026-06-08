import Link from "next/link";
import type { MyBookingsPageData } from "@/features/bookings/types/bookings";

function buildHref({
    page,
    search,
    status,
}: {
    page: number;
    search: string;
    status: string;
}) {
    const params = new URLSearchParams();

    if (search) params.set("q", search);
    if (status && status !== "all") params.set("status", status);
    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    return query ? `/booking?${query}` : "/booking";
}

export default function BookingPagination({
    pagination,
    filters,
}: Pick<MyBookingsPageData, "pagination" | "filters">) {
    const previousPage = Math.max(1, pagination.page - 1);
    const nextPage = Math.min(pagination.totalPages, pagination.page + 1);
    const hasPrevious = pagination.page > 1;
    const hasNext = pagination.page < pagination.totalPages;

    if (pagination.totalPages <= 1) return null;

    return (
        <nav
            className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            aria-label="Booking history pagination"
        >
            <p className="text-sm font-medium text-muted">
                Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
                {hasPrevious ? (
                    <Link
                        href={buildHref({
                            page: previousPage,
                            search: filters.search,
                            status: filters.status,
                        })}
                        className="btn-secondary flex-1 sm:flex-none"
                    >
                        Previous
                    </Link>
                ) : (
                    <span className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-muted opacity-60 sm:flex-none">
                        Previous
                    </span>
                )}

                {hasNext ? (
                    <Link
                        href={buildHref({
                            page: nextPage,
                            search: filters.search,
                            status: filters.status,
                        })}
                        className="btn-secondary flex-1 sm:flex-none"
                    >
                        Next
                    </Link>
                ) : (
                    <span className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-muted opacity-60 sm:flex-none">
                        Next
                    </span>
                )}
            </div>
        </nav>
    );
}
