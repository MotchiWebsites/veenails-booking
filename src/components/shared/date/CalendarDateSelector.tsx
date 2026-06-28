"use client";

import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function fromDateKey(value?: string) {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

export default function CalendarDateSelector({
    name,
    defaultValue,
    min = toDateKey(new Date()),
    label = "Appointment Date",
    onChange,
}: {
    name: string;
    defaultValue?: string;
    min?: string;
    label?: string;
    onChange?: (value: string) => void;
}) {
    const initialDate =
        fromDateKey(defaultValue) ?? fromDateKey(min) ?? new Date();
    const [selected, setSelected] = useState(
        defaultValue ?? toDateKey(initialDate),
    );
    const [visibleMonth, setVisibleMonth] = useState(
        new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    );
    const minimum = fromDateKey(min);

    const days = useMemo(() => {
        const first = new Date(
            visibleMonth.getFullYear(),
            visibleMonth.getMonth(),
            1,
        );
        const gridStart = new Date(first);
        gridStart.setDate(first.getDate() - first.getDay());

        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + index);
            return date;
        });
    }, [visibleMonth]);

    return (
        <fieldset className="rounded-3xl border border-border/60 bg-background p-4">
            <legend className="label-text px-2 text-lg">{label}</legend>
            <input type="hidden" name={name} value={selected} />
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    aria-label="Previous month"
                    className="rounded-full p-2 text-dark-green transition hover:bg-surface-2"
                    onClick={() =>
                        setVisibleMonth(
                            new Date(
                                visibleMonth.getFullYear(),
                                visibleMonth.getMonth() - 1,
                                1,
                            ),
                        )
                    }
                >
                    <FiChevronLeft aria-hidden="true" />
                </button>
                <p className="font-semibold text-foreground">
                    {visibleMonth.toLocaleDateString("en-CA", {
                        month: "long",
                        year: "numeric",
                    })}
                </p>
                <button
                    type="button"
                    aria-label="Next month"
                    className="rounded-full p-2 text-dark-green transition hover:bg-surface-2"
                    onClick={() =>
                        setVisibleMonth(
                            new Date(
                                visibleMonth.getFullYear(),
                                visibleMonth.getMonth() + 1,
                                1,
                            ),
                        )
                    }
                >
                    <FiChevronRight aria-hidden="true" />
                </button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((day) => (
                    <span
                        key={day}
                        className="py-1 text-xs font-semibold text-muted"
                    >
                        {day}
                    </span>
                ))}
                {days.map((date) => {
                    const value = toDateKey(date);
                    const outside = date.getMonth() !== visibleMonth.getMonth();
                    const disabled = Boolean(minimum && date < minimum);
                    const isSelected = value === selected;

                    return (
                        <button
                            key={value}
                            type="button"
                            disabled={disabled}
                            aria-pressed={isSelected}
                            onClick={() => {
                                setSelected(value);
                                onChange?.(value);
                            }}
                            className={`aspect-square rounded-xl text-sm transition ${
                                isSelected
                                    ? "bg-dark-green font-semibold text-white shadow-sm"
                                    : outside
                                      ? "text-muted/50 hover:bg-surface-2"
                                      : "text-foreground hover:bg-surface-2"
                            } disabled:cursor-not-allowed disabled:opacity-25`}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}
