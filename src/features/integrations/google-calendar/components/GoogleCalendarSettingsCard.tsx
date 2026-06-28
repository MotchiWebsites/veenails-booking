"use client";

import {
    useActionState,
    useEffect,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
    disconnectGoogleCalendarAction,
    selectGoogleCalendarAction,
    type GoogleCalendarActionState,
} from "@/features/integrations/google-calendar/actions/integration";
import type { GoogleCalendarSettingsData } from "@/features/integrations/google-calendar/data/integration";

const initialState: GoogleCalendarActionState = {
    error: "",
    success: "",
    messageId: "",
};

const CALLBACK_MESSAGES: Record<
    string,
    { variant: "success" | "error"; message: string }
> = {
    choose_calendar: {
        variant: "success",
        message: "Google authorized. Choose the studio calendar to finish.",
    },
    invalid_state: {
        variant: "error",
        message: "That Google connection request expired. Please try again.",
    },
    reconnect_required: {
        variant: "error",
        message: "Google needs fresh permission. Choose Reconnect and try again.",
    },
    no_writable_calendars: {
        variant: "error",
        message: "This Google account has no calendars you can edit.",
    },
    connection_failed: {
        variant: "error",
        message: "Google Calendar could not be connected. Please try again.",
    },
    not_configured: {
        variant: "error",
        message: "Google Calendar is not configured in this environment.",
    },
};

function formatSyncTime(value: string | null) {
    if (!value) return "No successful sync yet";
    return new Intl.DateTimeFormat("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default function GoogleCalendarSettingsCard({
    integration,
    callbackResult,
}: {
    integration: GoogleCalendarSettingsData;
    callbackResult?: string;
}) {
    const [choosing, setChoosing] = useState(integration.pendingSelection);
    const [selectedCalendarId, setSelectedCalendarId] = useState(
        integration.calendarId ?? "primary",
    );
    const [displayedCalendar, setDisplayedCalendar] = useState({
        id: integration.calendarId,
        name: integration.calendarName,
    });
    const [selecting, startSelecting] = useTransition();
    const [disconnectState, disconnectAction, disconnecting] = useActionState(
        disconnectGoogleCalendarAction,
        initialState,
    );
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!callbackResult) return;
        const message = CALLBACK_MESSAGES[callbackResult];
        if (!message) return;
        if (message.variant === "success") toast.success(message.message);
        else toast.error(message.message);
    }, [callbackResult, toast]);

    useEffect(() => {
        if (disconnectState.success) toast.success(disconnectState.success);
        if (disconnectState.error) toast.error(disconnectState.error);
    }, [disconnectState, toast]);

    const stateLabel =
        integration.syncState === "synced"
            ? "Connected"
            : integration.syncState === "reconnect"
              ? "Reconnect needed"
              : integration.syncState === "attention"
                ? "Sync needs attention"
                : "Not connected";
    const selectedCalendarAccessible =
        !displayedCalendar.id ||
        integration.calendars.some(
            (calendar) => calendar.id === displayedCalendar.id,
        );
    const selectedCalendarIsWritable = integration.calendars.some(
        (calendar) => calendar.id === selectedCalendarId,
    );

    function saveCalendar(formData: FormData) {
        startSelecting(async () => {
            const nextState = await selectGoogleCalendarAction(
                initialState,
                formData,
            );
            if (nextState.error) {
                toast.error(nextState.error);
                return;
            }
            if (nextState.calendarId && nextState.calendarName) {
                setSelectedCalendarId(nextState.calendarId);
                setDisplayedCalendar({
                    id: nextState.calendarId,
                    name: nextState.calendarName,
                });
            }
            setChoosing(false);
            toast.success(nextState.success);
            if (callbackResult) {
                router.replace("/admin/settings", { scroll: false });
            } else {
                router.refresh();
            }
        });
    }

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Google Calendar
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                        Keep studio availability and confirmed appointments in
                        one calendar. Confirmed appointments include reminders
                        one day and 30 minutes before. Slots without an end time
                        reserve four hours.
                    </p>
                </div>
                <span className="w-fit rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-semibold text-muted">
                    {stateLabel}
                </span>
            </div>

            {!integration.connected && !integration.pendingSelection ? (
                <div className="mt-5">
                    <a
                        href="/api/google-calendar/connect"
                        className="btn-primary inline-flex"
                        aria-disabled={!integration.configured}
                    >
                        Connect Google Calendar
                    </a>
                    {!integration.configured ? (
                        <p className="mt-3 text-xs text-muted">
                            Add the required server environment variables before
                            connecting.
                        </p>
                    ) : null}
                </div>
            ) : (
                <div className="mt-5 space-y-4">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                            <dt className="text-muted">Google account</dt>
                            <dd className="mt-1 font-medium text-foreground">
                                {integration.googleEmail ?? "Connected account"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted">Studio calendar</dt>
                            <dd className="mt-1 font-medium text-foreground">
                                {displayedCalendar.name ?? "Choose a calendar"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted">Last successful sync</dt>
                            <dd className="mt-1 text-foreground">
                                {formatSyncTime(integration.lastSyncAt)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted">Current state</dt>
                            <dd className="mt-1 text-foreground">{stateLabel}</dd>
                        </div>
                    </dl>

                    {!selectedCalendarAccessible ? (
                        <p className="rounded-2xl bg-background px-4 py-3 text-sm text-muted">
                            The selected calendar is no longer available to this
                            Google account. Choose another writable calendar to
                            continue syncing.
                        </p>
                    ) : null}

                    {choosing ? (
                        <form action={saveCalendar} className="max-w-xl space-y-5">
                            <hr className="border-border/60" />
                            <label className="block">
                                <span className="label-text block">
                                    Pick a calendar
                                </span>
                                <select
                                    className="input-field mt-2"
                                    name="calendarId"
                                    value={selectedCalendarId}
                                    onChange={(event) =>
                                        setSelectedCalendarId(event.target.value)
                                    }
                                    required
                                >
                                    {!selectedCalendarAccessible &&
                                    displayedCalendar.id ? (
                                        <option
                                            value={displayedCalendar.id}
                                            disabled
                                        >
                                            {displayedCalendar.name ??
                                                "Previously selected calendar"}{" "}
                                            (Unavailable)
                                        </option>
                                    ) : null}
                                    {integration.calendars.map((calendar) => (
                                        <option
                                            key={calendar.id}
                                            value={calendar.id}
                                        >
                                            {calendar.name}
                                            {calendar.primary ? " (Primary)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={
                                        selecting ||
                                        !selectedCalendarIsWritable
                                    }
                                >
                                    {selecting
                                        ? "Saving…"
                                        : "Use this calendar"}
                                </button>
                                {integration.connected ? (
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setChoosing(false)}
                                    >
                                        Cancel
                                    </button>
                                ) : null}
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setSelectedCalendarId(
                                        displayedCalendar.id ?? "primary",
                                    );
                                    setChoosing(true);
                                }}
                            >
                                Change calendar
                            </button>
                            <a
                                href="/api/google-calendar/connect?reconnect=1"
                                className="btn-secondary inline-flex"
                            >
                                Reconnect
                            </a>
                            <form action={disconnectAction}>
                                <button
                                    type="submit"
                                    className="btn-secondary"
                                    disabled={disconnecting}
                                >
                                    {disconnecting
                                        ? "Disconnecting…"
                                        : "Disconnect"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
