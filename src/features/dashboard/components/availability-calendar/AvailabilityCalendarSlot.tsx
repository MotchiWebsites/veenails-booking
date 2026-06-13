import Link from "next/link";

import {
    formatSlotTime,
    type DashboardCalendarSlot,
} from "./availability-calendar-utils";

export default function AvailabilityCalendarSlot({
    slot,
}: {
    slot: DashboardCalendarSlot;
}) {
    const timeRange = formatSlotTime(slot.startsAt, slot.endsAt);

    if (!slot.available) {
        return (
            <div className="rounded-2xl border border-border/60 bg-surface px-4 py-3 opacity-70">
                <p className="text-sm font-semibold text-foreground">
                    {timeRange}
                </p>
                <p className="mt-1 text-xs font-medium text-muted">
                    Unavailable
                </p>
            </div>
        );
    }

    return (
        <Link
            href={`/book?slotId=${encodeURIComponent(slot.id)}`}
            className="group block rounded-2xl border border-pink-main/20 bg-pink-main/10 px-4 py-3 text-left transition hover:border-pink-main/40 hover:bg-pink-main/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Book ${timeRange}`}
        >
            <p className="text-sm font-semibold text-foreground">
                {timeRange}
            </p>
            <p className="mt-1 text-xs font-semibold text-dark-green">
                Available
            </p>
        </Link>
    );
}
