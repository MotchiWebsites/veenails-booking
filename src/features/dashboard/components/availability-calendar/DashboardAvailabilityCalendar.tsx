"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { FiCalendar } from "react-icons/fi";

import AvailabilityCalendarDayColumn from "./AvailabilityCalendarDayColumn";
import AvailabilityCalendarHeader from "./AvailabilityCalendarHeader";
import {
    formatVisibleDateRange,
    type DashboardCalendarDay,
} from "./availability-calendar-utils";

function subscribeToResize(callback: () => void) {
    window.addEventListener("resize", callback);

    return () => window.removeEventListener("resize", callback);
}

function getVisibleDayCountSnapshot() {
    if (typeof window === "undefined") {
        return 1;
    }

    if (window.innerWidth >= 1280) {
        return 5;
    }

    if (window.innerWidth >= 768) {
        return 3;
    }

    return 1;
}

function getServerVisibleDayCountSnapshot() {
    return 1;
}

function useVisibleDayCount() {
    return useSyncExternalStore(
        subscribeToResize,
        getVisibleDayCountSnapshot,
        getServerVisibleDayCountSnapshot,
    );
}

export default function DashboardAvailabilityCalendar({
    days,
}: {
    days: DashboardCalendarDay[];
}) {
    const visibleCount = useVisibleDayCount();
    const [startIndex, setStartIndex] = useState(0);
    const normalizedDays = useMemo(() => days ?? [], [days]);
    const maxStartIndex = Math.max(0, normalizedDays.length - visibleCount);
    const boundedStartIndex = Math.min(startIndex, maxStartIndex);
    const visibleDays = normalizedDays.slice(
        boundedStartIndex,
        boundedStartIndex + visibleCount,
    );
    const dateRange = formatVisibleDateRange(visibleDays);
    const canGoBack = boundedStartIndex > 0;
    const canGoForward =
        boundedStartIndex + visibleCount < normalizedDays.length;
    const hasAnySlots = normalizedDays.some((day) => day.slots.length > 0);
    const hasVisibleSlots = visibleDays.some((day) => day.slots.length > 0);

    if (!hasAnySlots) {
        return (
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-main/10 text-pink-main">
                        <FiCalendar className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            Upcoming openings
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                            No appointment openings are listed right now.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6 lg:p-7">
            <AvailabilityCalendarHeader
                dateRange={dateRange}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onToday={() => setStartIndex(0)}
                onPrevious={() =>
                    setStartIndex(
                        Math.max(0, boundedStartIndex - visibleCount),
                    )
                }
                onNext={() =>
                    setStartIndex(
                        Math.min(
                            maxStartIndex,
                            boundedStartIndex + visibleCount,
                        ),
                    )
                }
            />

            {!hasVisibleSlots ? (
                <div className="mt-5 rounded-3xl border border-dashed border-border/60 bg-background p-5 text-sm text-muted">
                    No openings in this date range. Try the next dates.
                </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                {visibleDays.map((day) => (
                    <AvailabilityCalendarDayColumn
                        key={day.date}
                        day={day}
                    />
                ))}
            </div>
        </section>
    );
}
