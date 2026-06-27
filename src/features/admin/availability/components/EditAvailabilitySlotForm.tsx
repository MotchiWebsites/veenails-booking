"use client";

import { FiX } from "react-icons/fi";
import CalendarDateSelector from "@/components/shared/date/CalendarDateSelector";
import { updateAvailabilitySlotAction } from "@/features/admin/availability/actions/admin-availability";
import type { AdminAvailabilitySlot } from "@/features/admin/availability/data/admin-availability";

function localParts(value: string | null) {
    if (!value) {
        return { date: "", time: "" };
    }

    const date = new Date(value);

    return {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
    };
}

const TIMES = Array.from({ length: 65 }, (_, index) => {
    const minutes = 7 * 60 + index * 15;
    const hours = Math.floor(minutes / 60);
    const minute = minutes % 60;

    return {
        value: `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        label: new Date(2000, 0, 1, hours, minute).toLocaleTimeString(
            "en-CA",
            { hour: "numeric", minute: "2-digit" },
        ),
    };
});

export default function EditAvailabilitySlotForm({
    slot,
    onClose,
}: {
    slot: AdminAvailabilitySlot;
    onClose: () => void;
}) {
    const start = localParts(slot.startsAt);
    const end = localParts(slot.endsAt);

    return (
        <div
            id={`edit-slot-${slot.id}`}
            className="border-t border-border/60 bg-surface-2/50 px-4 py-5 sm:px-5 sm:py-6"
        >
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-foreground">Edit slot</h3>
                    <p className="mt-1 text-sm text-muted">
                        Change the date, time, status, or internal note.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close slot editor"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface text-foreground transition hover:border-dark-green/30 hover:text-dark-green"
                >
                    <FiX className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            <form action={updateAvailabilitySlotAction}>
                <input type="hidden" name="slotId" value={slot.id} />
                <input
                    type="hidden"
                    name="timezoneOffset"
                    value={new Date().getTimezoneOffset()}
                />

                <div className="grid items-start gap-5 xl:grid-cols-[minmax(18rem,25rem)_minmax(0,1fr)]">
                    <CalendarDateSelector
                        name="date"
                        defaultValue={start.date}
                    />

                    <div className="space-y-4 rounded-2xl border border-border/60 bg-surface p-4 sm:p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-2">
                                <span className="label-text">Start time</span>
                                <select
                                    name="startTime"
                                    defaultValue={start.time}
                                    className="input-field"
                                >
                                    {TIMES.map((time) => (
                                        <option key={time.value} value={time.value}>
                                            {time.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-2">
                            <span className="label-text">End time (optional)</span>
                            <select
                                name="endTime"
                                defaultValue={end.time}
                                className="input-field"
                            >
                                <option value="">No end time</option>
                                {TIMES.map((time) => (
                                        <option key={time.value} value={time.value}>
                                            {time.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label className="block space-y-2">
                            <span className="label-text">Status</span>
                            <select
                                name="status"
                                defaultValue={slot.status}
                                className="input-field"
                            >
                                <option value="available">Open</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </label>

                        <label className="block space-y-2">
                            <span className="label-text">Internal note</span>
                            <textarea
                                name="notes"
                                defaultValue={slot.notes ?? ""}
                                rows={3}
                                className="input-field resize-none"
                                placeholder="Optional note about this slot"
                            />
                        </label>

                        <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                Save changes
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
