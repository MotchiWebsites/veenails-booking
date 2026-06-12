"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    FiArrowLeft,
    FiArrowRight,
    FiCalendar,
    FiClock,
    FiRefreshCw,
} from "react-icons/fi";

type AvailabilityCalendarDay = {
    date: string;
    label: string;
    slots: {
        id: string;
        startsAt: string;
        endsAt: string;
        available: boolean;
    }[];
};

export default function AvailabilityCalendarStrip({
    days,
}: {
    days: AvailabilityCalendarDay[];
}) {
    const [visibleCount, setVisibleCount] = useState(3);
    const [startIndex, setStartIndex] = useState(0);

    useEffect(() => {
        const updateVisibleCount = () => {
            setVisibleCount(window.innerWidth >= 1280 ? 7 : 3);
        };

        updateVisibleCount();
        window.addEventListener("resize", updateVisibleCount);

        return () => window.removeEventListener("resize", updateVisibleCount);
    }, []);

    const normalizedDays = useMemo(() => days ?? [], [days]);
    const maxStartIndex = Math.max(0, normalizedDays.length - visibleCount);
    const boundedStartIndex = Math.min(startIndex, maxStartIndex);
    const visibleDays = normalizedDays.slice(
        boundedStartIndex,
        boundedStartIndex + visibleCount,
    );
    const canGoBack = boundedStartIndex > 0;
    const canGoForward =
        boundedStartIndex + visibleCount < normalizedDays.length;
    const hasAnySlots = normalizedDays.some((day) => day.slots.length > 0);

    if (!hasAnySlots) {
        return (
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-main">
                        <FiCalendar className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            Upcoming availability
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                            No upcoming appointment slots are open right now.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-dark-green">
                        Availability
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                        Upcoming Appointment Slots
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        Tap an available time to start booking with that slot
                        preselected.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setStartIndex(0)}
                        disabled={!canGoBack}
                        className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            setStartIndex(
                                Math.max(0, boundedStartIndex - visibleCount),
                            )
                        }
                        disabled={!canGoBack}
                        aria-label="Show earlier dates"
                        className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            setStartIndex(
                                Math.min(
                                    maxStartIndex,
                                    boundedStartIndex + visibleCount,
                                ),
                            )
                        }
                        disabled={!canGoForward}
                        aria-label="Show later dates"
                        className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FiArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-7 lg:grid-cols-3">
                {visibleDays.map((day) => (
                    <article
                        key={day.date}
                        className="rounded-3xl border border-border/60 bg-background p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    {day.label}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">
                                    {day.slots.length} slot
                                    {day.slots.length === 1 ? "" : "s"}
                                </p>
                            </div>
                            <FiClock
                                className="h-4 w-4 text-muted"
                                aria-hidden="true"
                            />
                        </div>

                        <div className="mt-4 space-y-3">
                            {day.slots.length > 0 ? (
                                day.slots.map((slot) => {
                                    const timeRange = formatTimeRange(
                                        slot.startsAt,
                                        slot.endsAt,
                                    );

                                    return slot.available ? (
                                        <Link
                                            key={slot.id}
                                            href={`/book?slotId=${encodeURIComponent(slot.id)}`}
                                            className="group block rounded-2xl border border-border/60 bg-surface px-4 py-3 text-left transition hover:border-pink-200 hover:bg-pink-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label={`Book ${timeRange} on ${day.label}`}
                                        >
                                            <p className="text-sm font-semibold text-foreground">
                                                {timeRange}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-dark-green">
                                                Available
                                            </p>
                                        </Link>
                                    ) : (
                                        <div
                                            key={slot.id}
                                            className="rounded-2xl border border-border/60 bg-surface px-4 py-3 text-left opacity-70"
                                        >
                                            <p className="text-sm font-semibold text-foreground">
                                                {timeRange}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-muted">
                                                Unavailable
                                            </p>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted">
                                    No times listed for this day.
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function formatTimeRange(startsAt: string, endsAt: string) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        hour: "numeric",
        minute: "2-digit",
    });

    return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}
