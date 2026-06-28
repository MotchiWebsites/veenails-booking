import {
    getStudioDateKey,
    getStudioTimeKey,
} from "@/lib/utils/studio-time";

export {
    getStudioDateKey,
    getStudioDateTimeParts,
    getStudioTimeKey,
    STUDIO_TIME_ZONE,
    studioDateTimeToDate,
} from "@/lib/utils/studio-time";

export type SlotTimeOption = {
    value: string;
    label: string;
};

const timeLabelFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
});

function timeToMinutes(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
}

export function getSlotTimeOptions({
    selectedDate,
    afterTime,
    now = new Date(),
}: {
    selectedDate: string;
    afterTime?: string | null;
    now?: Date;
}): SlotTimeOption[] {
    const today = getStudioDateKey(now);
    const currentMinutes = timeToMinutes(getStudioTimeKey(now));
    const afterMinutes = afterTime ? timeToMinutes(afterTime) : null;

    return Array.from({ length: 34 }, (_, index) => {
        const minutes = 7 * 60 + index * 30;
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;

        return {
            value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
            label: timeLabelFormatter.format(
                new Date(Date.UTC(2000, 0, 1, hour, minute)),
            ),
            minutes,
        };
    })
        .filter(
            (option) =>
                (selectedDate !== today || option.minutes > currentMinutes) &&
                (afterMinutes === null || option.minutes > afterMinutes),
        )
        .map(({ value, label }) => ({ value, label }));
}
