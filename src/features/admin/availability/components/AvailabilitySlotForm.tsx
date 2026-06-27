"use client";

import CalendarDateSelector from "@/components/shared/date/CalendarDateSelector";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    createAvailabilitySlotAction,
    type AvailabilityActionState,
} from "@/features/admin/availability/actions/admin-availability";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

function dateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const TIMES = Array.from({ length: 57 }, (_, index) => {
    const minutes = 8 * 60 + index * 15;
    const hours = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const value = `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const label = new Date(2000, 0, 1, hours, minute).toLocaleTimeString(
        "en-CA",
        {
            hour: "numeric",
            minute: "2-digit",
        },
    );
    return { value, label };
});

export default function AvailabilitySlotForm() {
    const today = dateKey(new Date());
    const [startTime, setStartTime] = useState("09:00");
    const router = useRouter();
    const { error, success } = useToast();
    const initialState: AvailabilityActionState = {
        error: "",
        success: "",
        messageId: "",
    };
    const [state, formAction, pending] = useActionState(
        createAvailabilitySlotAction,
        initialState,
    );

    const endTimeOptions = useMemo(() => {
        const startIndex = TIMES.findIndex((time) => time.value === startTime);
        return TIMES.slice(Math.min(startIndex + 1, TIMES.length - 1));
    }, [startTime]);

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Availability not added");
        }

        if (state.success) {
            success(state.success, "Availability added");
            router.refresh();
        }
    }, [error, router, state.error, state.messageId, state.success, success]);

    return (
        <form action={formAction} className="mt-6 space-y-5">
            <input
                type="hidden"
                name="timezoneOffset"
                value={new Date().getTimezoneOffset()}
            />
            <div className="grid gap-5 xl:grid-cols-[minmax(19rem,26rem)_minmax(0,1fr)]">
                <CalendarDateSelector name="date" defaultValue={today} />
                <div className="space-y-4 rounded-3xl bg-background p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                            <span className="label-text">Start time</span>
                            <select
                                name="startTime"
                                className="input-field"
                                defaultValue="09:00"
                                onChange={(event) =>
                                    setStartTime(event.target.value)
                                }
                            >
                                {TIMES.slice(0, -1).map((time) => (
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
                                className="input-field"
                                defaultValue=""
                            >
                                <option value="">No end time</option>
                                {endTimeOptions.map((time) => (
                                    <option key={time.value} value={time.value}>
                                        {time.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label className="block space-y-2">
                        <span className="label-text">Slot type</span>
                        <select
                            name="status"
                            className="input-field"
                            defaultValue="available"
                        >
                            <option value="available">Open for booking</option>
                            <option value="blocked">Blocked time</option>
                        </select>
                    </label>
                    <label className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface px-4 py-3 text-sm text-foreground">
                        <input type="hidden" name="regularsFirst" value="off" />
                        <input
                            type="checkbox"
                            name="regularsFirst"
                            value="on"
                            defaultChecked
                            className="mt-1"
                        />
                        <span>
                            <span className="block font-semibold">
                                Regular customers first
                            </span>
                            <span className="text-muted">
                                Regular customers can book now. Everyone else can book after the early-access window.
                            </span>
                        </span>
                    </label>
                    <label className="block space-y-2">
                        <span className="label-text">
                            Internal note (optional)
                        </span>
                        <textarea
                            name="notes"
                            rows={3}
                            className="input-field resize-none"
                            placeholder="Why this time is blocked, special hours…"
                        />
                    </label>
                    <button
                        type="submit"
                        className="btn-primary w-full sm:w-auto"
                        disabled={pending}
                    >
                        {pending ? "Adding..." : "Add availability"}
                    </button>
                    <p className="text-xs text-muted">
                        Times use 15-minute increments. Slots with an end time
                        cannot overlap another active slot.
                    </p>
                </div>
            </div>
        </form>
    );
}
