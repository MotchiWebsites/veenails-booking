"use client";

import { FiCalendar } from "react-icons/fi";
import type { AvailableAppointmentSlot } from "@/features/bookings/new-booking/types";
import {
    formatSlotShortDate,
    formatSlotTime,
} from "@/features/bookings/new-booking/utils";

type GroupedSlotDay = {
    key: string;
    label: string;
    slots: AvailableAppointmentSlot[];
};

type TimeStepProps = {
    groupedSlots: GroupedSlotDay[];
    selectedSlotId: string | null;
    onSelectSlot: (slotId: string) => void;
};

export default function TimeStep({
    groupedSlots,
    selectedSlotId,
    onSelectSlot,
}: TimeStepProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Choose a time
                    </h2>
                    <p className="text-sm leading-relaxed text-muted sm:text-base">
                        Select an active appointment slot to continue to the
                        booking questions.
                    </p>
                </div>
                
            </div>

            {groupedSlots.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-background px-5 py-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-pink-main">
                        <FiCalendar className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                        No available appointment slots right now.
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                        Please check back soon.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {groupedSlots.map((group) => (
                        <div key={group.key} className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-border/80" />
                                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-dark-green">
                                    {group.label}
                                </h3>
                                <div className="h-px flex-1 bg-border/80" />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {group.slots.map((slot) => {
                                    const bookable = slot.availability === "available";
                                    const selected = bookable && selectedSlotId === slot.id;

                                    return (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            aria-pressed={bookable ? selected : undefined}
                                            disabled={!bookable}
                                            onClick={() =>
                                                onSelectSlot(slot.id)
                                            }
                                            className={[
                                                "relative min-h-40 rounded-3xl border p-4 text-left shadow-sm transition-all duration-200",
                                                selected
                                                    ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                                    : bookable
                                                      ? "clickable border-border/60 bg-background hover:border-pink-200 hover:bg-pink-50/70"
                                                      : "cursor-not-allowed border-border/60 bg-surface-2 opacity-75",
                                            ].join(" ")}
                                        >
                                            {selected ? (
                                                <span className="absolute right-4 top-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-success">
                                                    Selected
                                                </span>
                                            ) : !bookable ? (
                                                <span className="absolute right-4 top-4 inline-flex rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted">
                                                    Booked
                                                </span>
                                            ) : null}

                                            <div
                                                className={
                                                    selected || !bookable ? "pr-24" : ""
                                                }
                                            >
                                                <p className="text-sm font-semibold leading-snug text-dark-green">
                                                    {formatSlotShortDate(
                                                        slot.startsAt,
                                                    )}
                                                </p>

                                                <p className="mt-3 whitespace-nowrap text-lg font-semibold leading-tight text-foreground sm:text-xl">
                                                    {slot.endsAt
                                                        ? `${formatSlotTime(slot.startsAt)} - ${formatSlotTime(slot.endsAt)}`
                                                        : formatSlotTime(slot.startsAt)}
                                                </p>

                                                {slot.endsAt ? null : (
                                                    <p className="mt-3 text-sm leading-relaxed text-muted">
                                                        End time pending
                                                    </p>
                                                )}

                                                {!bookable ? (
                                                    <p className="mt-3 text-sm font-medium text-muted">
                                                        This time is already booked.
                                                    </p>
                                                ) : null}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
