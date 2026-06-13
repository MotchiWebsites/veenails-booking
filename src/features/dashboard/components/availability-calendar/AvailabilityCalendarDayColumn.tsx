import { FiClock } from "react-icons/fi";

import AvailabilityCalendarSlot from "./AvailabilityCalendarSlot";
import {
    sortSlotsByStartTime,
    type DashboardCalendarDay,
} from "./availability-calendar-utils";

export default function AvailabilityCalendarDayColumn({
    day,
}: {
    day: DashboardCalendarDay;
}) {
    const slots = sortSlotsByStartTime(day.slots);

    return (
        <article className="min-h-64 rounded-3xl border border-border/60 bg-background p-4">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">
                            {day.dayName}
                        </h3>
                        {day.isToday ? (
                            <span className="rounded-full bg-pink-main/10 px-2.5 py-1 text-xs font-semibold text-pink-main">
                                Today
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                        {day.monthLabel} {day.dayNumber}
                    </p>
                </div>

                <FiClock className="h-4 w-4 text-muted" aria-hidden="true" />
            </div>

            <div className="mt-4 space-y-3">
                {slots.length > 0 ? (
                    slots.map((slot) => (
                        <AvailabilityCalendarSlot key={slot.id} slot={slot} />
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted">
                        No openings.
                    </div>
                )}
            </div>
        </article>
    );
}
