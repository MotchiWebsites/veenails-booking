export const STUDIO_TIME_ZONE = "America/Toronto";

export type SlotTimeOption = {
    value: string;
    label: string;
};

const studioPartsFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

const timeLabelFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
});

function partsRecord(date: Date) {
    return Object.fromEntries(
        studioPartsFormatter
            .formatToParts(date)
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, Number(part.value)]),
    ) as Record<"year" | "month" | "day" | "hour" | "minute", number>;
}

function timeToMinutes(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
}

export function getStudioDateKey(date = new Date()) {
    const parts = partsRecord(date);
    return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function getStudioTimeKey(date: Date) {
    const parts = partsRecord(date);
    return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function getStudioDateTimeParts(date: Date) {
    return {
        date: getStudioDateKey(date),
        time: getStudioTimeKey(date),
    };
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

export function studioDateTimeToDate(dateKey: string, timeKey: string) {
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) ||
        !/^\d{2}:\d{2}$/.test(timeKey)
    ) {
        throw new Error("Choose a valid date and time.");
    }

    const [year, month, day] = dateKey.split("-").map(Number);
    const [hour, minute] = timeKey.split(":").map(Number);
    if (
        minute % 30 !== 0 ||
        hour > 23 ||
        minute > 59 ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        throw new Error("Times must use 30-minute increments.");
    }

    const target = Date.UTC(year, month - 1, day, hour, minute);
    let guess = target;

    for (let pass = 0; pass < 3; pass += 1) {
        const parts = partsRecord(new Date(guess));
        const represented = Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
        );
        guess += target - represented;
    }

    const result = new Date(guess);
    const resultParts = getStudioDateTimeParts(result);
    if (resultParts.date !== dateKey || resultParts.time !== timeKey) {
        throw new Error("That time does not exist in the studio timezone.");
    }

    return result;
}
