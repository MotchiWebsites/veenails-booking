import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
    GoogleCalendarApiError,
    insertGoogleCalendarEvent,
    refreshGoogleAccessToken,
    removeGoogleCalendarEvent,
    updateGoogleCalendarEvent,
    type GoogleCalendarEventInput,
} from "@/features/integrations/google-calendar/services/google-api";
import {
    GOOGLE_CALENDAR_FALLBACK_DURATION_MINUTES,
    GOOGLE_CALENDAR_TIME_ZONE,
} from "@/features/integrations/google-calendar/utils/config";

type Integration = {
    id: string;
    calendar_id: string;
    encrypted_refresh_token: string;
};

type SyncResult = { status: "synced" | "skipped" | "failed" };

function safeSyncError(error: unknown) {
    if (error instanceof GoogleCalendarApiError) {
        if (error.reconnectRequired) return "reconnect_required";
        if (error.status === 403) return "calendar_permission_denied";
        if (error.status === 404) return "calendar_not_found";
    }
    return "google_calendar_sync_failed";
}

function logSyncError(scope: string, entityId: string, error: unknown) {
    console.error(
        JSON.stringify({
            scope: `google-calendar:${scope}`,
            entityId,
            error:
                error instanceof GoogleCalendarApiError
                    ? { status: error.status, reason: error.message }
                    : { reason: error instanceof Error ? error.name : "unknown" },
        }),
    );
}

function logSyncDecision(
    entityId: string,
    decision: "create" | "update" | "replace_missing" | "remove_duplicate",
    source: "slot" | "booking" | "deterministic",
) {
    console.info(
        JSON.stringify({
            scope: "google-calendar:event-resolution",
            entityId,
            decision,
            source,
        }),
    );
}

async function activeIntegration(): Promise<Integration | null> {
    const { data, error } = await createAdminClient()
        .from("google_calendar_integrations")
        .select("id, calendar_id, encrypted_refresh_token")
        .eq("is_active", true)
        .eq("needs_reconnect", false)
        .order("connected_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .overrideTypes<Integration | null>();
    if (error) throw error;
    return data;
}

function deterministicEventId(entity: "slot" | "booking", id: string) {
    return `vee${entity === "slot" ? "s" : "b"}${id.replaceAll("-", "")}`;
}

async function upsertLifecycleEvent({
    accessToken,
    integration,
    entityId,
    slotEventId,
    bookingEventId,
    fallbackEventId,
    event,
}: {
    accessToken: string;
    integration: Integration;
    entityId: string;
    slotEventId: string | null;
    bookingEventId?: string | null;
    fallbackEventId: string;
    event: GoogleCalendarEventInput;
}) {
    const candidates = [
        { id: slotEventId, source: "slot" as const },
        { id: bookingEventId ?? null, source: "booking" as const },
    ].filter(
        (
            candidate,
            index,
            all,
        ): candidate is { id: string; source: "slot" | "booking" } =>
            Boolean(candidate.id) &&
            all.findIndex((item) => item.id === candidate.id) === index,
    );

    for (const candidate of candidates) {
        try {
            const updated = await updateGoogleCalendarEvent(
                accessToken,
                integration.calendar_id,
                candidate.id,
                event,
            );
            logSyncDecision(entityId, "update", candidate.source);

            for (const duplicate of candidates) {
                if (duplicate.id === candidate.id) continue;
                await removeGoogleCalendarEvent(
                    accessToken,
                    integration.calendar_id,
                    duplicate.id,
                );
                logSyncDecision(
                    entityId,
                    "remove_duplicate",
                    duplicate.source,
                );
            }

            return updated;
        } catch (error) {
            if (
                !(error instanceof GoogleCalendarApiError) ||
                (error.status !== 404 && error.status !== 410)
            ) {
                throw error;
            }
            logSyncDecision(entityId, "replace_missing", candidate.source);
        }
    }

    try {
        const created = await insertGoogleCalendarEvent(
            accessToken,
            integration.calendar_id,
            event,
            fallbackEventId,
        );
        logSyncDecision(entityId, "create", "deterministic");
        return created;
    } catch (error) {
        if (error instanceof GoogleCalendarApiError && error.status === 409) {
            const updated = await updateGoogleCalendarEvent(
                accessToken,
                integration.calendar_id,
                fallbackEventId,
                event,
            );
            logSyncDecision(entityId, "update", "deterministic");
            return updated;
        }
        throw error;
    }
}

async function removeLifecycleEvents({
    accessToken,
    integration,
    entityId,
    slotEventId,
    bookingEventId,
}: {
    accessToken: string;
    integration: Integration;
    entityId: string;
    slotEventId: string | null;
    bookingEventId: string | null;
}) {
    const eventIds = [...new Set([slotEventId, bookingEventId].filter(Boolean))] as string[];
    for (const eventId of eventIds) {
        await removeGoogleCalendarEvent(
            accessToken,
            integration.calendar_id,
            eventId,
        );
    }
    if (eventIds.length) {
        console.info(
            JSON.stringify({
                scope: "google-calendar:event-resolution",
                entityId,
                decision: "delete",
                eventCount: eventIds.length,
            }),
        );
    }
}

export function resolveGoogleCalendarEventEndTime({
    startsAt,
    endsAt,
    durationMinutes,
    settingsDurationMinutes,
}: {
    startsAt: string;
    endsAt?: string | null;
    durationMinutes?: number | null;
    settingsDurationMinutes?: number | null;
}) {
    const start = new Date(startsAt);
    const suppliedEnd = endsAt ? new Date(endsAt) : null;
    if (
        suppliedEnd &&
        Number.isFinite(suppliedEnd.getTime()) &&
        suppliedEnd > start
    ) {
        return suppliedEnd.toISOString();
    }
    const minutes =
        durationMinutes && durationMinutes > 0
            ? durationMinutes
            : settingsDurationMinutes && settingsDurationMinutes > 0
              ? settingsDurationMinutes
              : GOOGLE_CALENDAR_FALLBACK_DURATION_MINUTES;
    const end = new Date(start.getTime() + minutes * 60 * 1000);
    if (!Number.isFinite(end.getTime()) || end <= start) {
        throw new Error("Unable to resolve Google Calendar event end time.");
    }
    return end.toISOString();
}

function availableSlotEvent(slot: {
    id: string;
    starts_at: string;
    ends_at: string | null;
}): GoogleCalendarEventInput {
    return {
        summary: "Available slot — Vee’s Nail Studio",
        description: [
            "Availability slot",
            `Slot ID: ${slot.id}`,
            "Status: Available",
        ].join("\n"),
        start: {
            dateTime: slot.starts_at,
            timeZone: GOOGLE_CALENDAR_TIME_ZONE,
        },
        end: {
            dateTime: resolveGoogleCalendarEventEndTime({
                startsAt: slot.starts_at,
                endsAt: slot.ends_at,
            }),
            timeZone: GOOGLE_CALENDAR_TIME_ZONE,
        },
        transparency: "transparent",
        status: "confirmed",
        reminders: { useDefault: false, overrides: [] },
    };
}

function compactCalendarServiceTitle(
    items: Array<{
        label_snapshot: string;
        active: boolean;
        removed_at: string | null;
        item_type: string;
    }>,
) {
    const labels = items
        .filter(
            (item) =>
                item.active &&
                !item.removed_at &&
                item.item_type !== "discount",
        )
        .sort((left, right) => {
            const priority: Record<string, number> = {
                service: 0,
                design_tier: 1,
                addon: 2,
                removal: 3,
            };
            return (
                (priority[left.item_type] ?? 4) -
                (priority[right.item_type] ?? 4)
            );
        })
        .map((item) => item.label_snapshot.trim())
        .filter(Boolean);
    if (!labels.length) return "Nail appointment";

    const remaining = labels.length - 1;
    const suffix = remaining > 0 ? ` +${remaining} more` : "";
    const maxPrimaryLength = Math.max(24, 62 - suffix.length);
    const primary =
        labels[0].length > maxPrimaryLength
            ? `${labels[0].slice(0, maxPrimaryLength - 1).trimEnd()}…`
            : labels[0];
    return `${primary}${suffix}`;
}

async function recordIntegrationSuccess(integrationId: string) {
    await createAdminClient()
        .from("google_calendar_integrations")
        .update({
            last_sync_at: new Date().toISOString(),
            last_sync_error: null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", integrationId);
}

async function recordIntegrationFailure(error: string) {
    await createAdminClient()
        .from("google_calendar_integrations")
        .update({
            last_sync_error: error,
            updated_at: new Date().toISOString(),
        })
        .eq("is_active", true);
}

export async function syncAvailabilitySlotToGoogleCalendar(
    slotId: string,
    options: { forceReplacement?: boolean } = {},
): Promise<SyncResult> {
    const admin = createAdminClient();
    const { data: slot, error: slotError } = await admin
        .from("availability_slots")
        .select("id, starts_at, ends_at, status, active, google_calendar_event_id")
        .eq("id", slotId)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            starts_at: string;
            ends_at: string | null;
            status: string;
            active: boolean;
            google_calendar_event_id: string | null;
        } | null>();
    if (slotError || !slot) return { status: "skipped" };

    try {
        const integration = await activeIntegration();
        if (!integration) {
            await admin
                .from("availability_slots")
                .update({ google_calendar_sync_error: "not_connected" })
                .eq("id", slotId);
            return { status: "skipped" };
        }
        const accessToken = await refreshGoogleAccessToken(
            integration.id,
            integration.encrypted_refresh_token,
        );
        const shouldKeep =
            slot.active &&
            new Date(slot.starts_at) > new Date() &&
            ["available", "held", "requested"].includes(slot.status);

        if (!shouldKeep) {
            if (slot.google_calendar_event_id) {
                await removeGoogleCalendarEvent(
                    accessToken,
                    integration.calendar_id,
                    slot.google_calendar_event_id,
                );
            }
            await admin
                .from("availability_slots")
                .update({
                    google_calendar_event_id: null,
                    google_calendar_synced_at: new Date().toISOString(),
                    google_calendar_sync_error: null,
                })
                .eq("id", slotId);
            await recordIntegrationSuccess(integration.id);
            return { status: "synced" };
        }

        const googleEvent = await upsertLifecycleEvent({
            accessToken,
            integration,
            entityId: slot.id,
            slotEventId: slot.google_calendar_event_id,
            fallbackEventId: options.forceReplacement
                ? `veer${crypto.randomUUID().replaceAll("-", "")}`
                : deterministicEventId("slot", slot.id),
            event: availableSlotEvent(slot),
        });
        await admin
            .from("availability_slots")
            .update({
                google_calendar_event_id: googleEvent.id,
                google_calendar_synced_at: new Date().toISOString(),
                google_calendar_sync_error: null,
            })
            .eq("id", slotId);
        await recordIntegrationSuccess(integration.id);
        return { status: "synced" };
    } catch (error) {
        const safeError = safeSyncError(error);
        logSyncError("slot", slotId, error);
        await Promise.all([
            admin
                .from("availability_slots")
                .update({ google_calendar_sync_error: safeError })
                .eq("id", slotId),
            recordIntegrationFailure(safeError),
        ]);
        return { status: "failed" };
    }
}

export async function syncBookingRescheduleToGoogleCalendar({
    bookingId,
    previousSlotId,
    newSlotId,
}: {
    bookingId: string;
    previousSlotId: string | null;
    newSlotId: string;
}): Promise<SyncResult> {
    const admin = createAdminClient();
    try {
        const [bookingResult, oldSlotResult, newSlotResult, integration] =
            await Promise.all([
                admin
                    .from("bookings")
                    .select("google_calendar_event_id")
                    .eq("id", bookingId)
                    .maybeSingle()
                    .overrideTypes<{
                        google_calendar_event_id: string | null;
                    } | null>(),
                previousSlotId
                    ? admin
                          .from("availability_slots")
                          .select("google_calendar_event_id")
                          .eq("id", previousSlotId)
                          .maybeSingle()
                          .overrideTypes<{
                              google_calendar_event_id: string | null;
                          } | null>()
                    : Promise.resolve({ data: null, error: null }),
                admin
                    .from("availability_slots")
                    .select("google_calendar_event_id")
                    .eq("id", newSlotId)
                    .maybeSingle()
                    .overrideTypes<{
                        google_calendar_event_id: string | null;
                    } | null>(),
                activeIntegration(),
            ]);
        if (!integration) return syncBookingToGoogleCalendar(bookingId);
        const retainedSlotEventId =
            oldSlotResult.data?.google_calendar_event_id ??
            bookingResult.data?.google_calendar_event_id ??
            null;
        const destinationEventId =
            newSlotResult.data?.google_calendar_event_id ?? null;
        const accessToken = await refreshGoogleAccessToken(
            integration.id,
            integration.encrypted_refresh_token,
        );
        if (
            destinationEventId &&
            destinationEventId !== retainedSlotEventId
        ) {
            await removeGoogleCalendarEvent(
                accessToken,
                integration.calendar_id,
                destinationEventId,
            );
        }
        await Promise.all([
            admin
                .from("availability_slots")
                .update({ google_calendar_event_id: retainedSlotEventId })
                .eq("id", newSlotId),
            previousSlotId
                ? admin
                      .from("availability_slots")
                      .update({ google_calendar_event_id: null })
                      .eq("id", previousSlotId)
                : Promise.resolve(),
        ]);
        const bookingSync = await syncBookingToGoogleCalendar(bookingId);
        if (previousSlotId) {
            await syncAvailabilitySlotToGoogleCalendar(previousSlotId, {
                forceReplacement: true,
            });
        }
        return bookingSync;
    } catch (error) {
        logSyncError("reschedule", bookingId, error);
        const safeError = safeSyncError(error);
        await Promise.all([
            admin
                .from("bookings")
                .update({
                    google_calendar_sync_error: safeError,
                })
                .eq("id", bookingId),
            recordIntegrationFailure(safeError),
        ]);
        return { status: "failed" };
    }
}

export async function syncBookingToGoogleCalendar(
    bookingId: string,
): Promise<SyncResult> {
    const admin = createAdminClient();
    const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .select(
            "id, booking_reference, status, slot_id, client_display_name, client_email, client_instagram_handle, google_calendar_event_id, profiles:user_id(display_name, email, instagram_handle), availability_slots:slot_id(id, starts_at, ends_at, active, status, google_calendar_event_id), booking_line_items(label_snapshot, active, removed_at, item_type)",
        )
        .eq("id", bookingId)
        .maybeSingle()
        .overrideTypes<{
            id: string;
            booking_reference: string;
            status: string;
            slot_id: string | null;
            client_display_name: string | null;
            client_email: string | null;
            client_instagram_handle: string | null;
            google_calendar_event_id: string | null;
            profiles: {
                display_name: string | null;
                email: string | null;
                instagram_handle: string | null;
            } | null;
            availability_slots: {
                id: string;
                starts_at: string;
                ends_at: string | null;
                active: boolean;
                status: string;
                google_calendar_event_id: string | null;
            } | null;
            booking_line_items: Array<{
                label_snapshot: string;
                active: boolean;
                removed_at: string | null;
                item_type: string;
            }> | null;
        } | null>();
    if (bookingError || !booking) return { status: "skipped" };

    try {
        const integration = await activeIntegration();
        if (!integration) {
            await admin
                .from("bookings")
                .update({ google_calendar_sync_error: "not_connected" })
                .eq("id", bookingId);
            return { status: "skipped" };
        }
        const accessToken = await refreshGoogleAccessToken(
            integration.id,
            integration.encrypted_refresh_token,
        );
        const slot = booking.availability_slots;
        const slotEventId = slot?.google_calendar_event_id ?? null;
        const bookingEventId = booking.google_calendar_event_id;

        if (["cancelled", "rejected", "expired"].includes(booking.status)) {
            const reopened =
                slot?.active &&
                slot.status === "available" &&
                new Date(slot.starts_at) > new Date();
            if (reopened && slot) {
                const googleEvent = await upsertLifecycleEvent({
                    accessToken,
                    integration,
                    entityId: booking.id,
                    slotEventId,
                    bookingEventId,
                    fallbackEventId: deterministicEventId("slot", slot.id),
                    event: availableSlotEvent(slot),
                });
                await Promise.all([
                    admin
                        .from("availability_slots")
                        .update({
                            google_calendar_event_id: googleEvent.id,
                            google_calendar_synced_at: new Date().toISOString(),
                            google_calendar_sync_error: null,
                        })
                        .eq("id", slot.id),
                    admin
                        .from("bookings")
                        .update({
                            google_calendar_event_id: googleEvent.id,
                            google_calendar_synced_at: new Date().toISOString(),
                            google_calendar_sync_error: null,
                        })
                        .eq("id", bookingId),
                ]);
            } else {
                await removeLifecycleEvents({
                    accessToken,
                    integration,
                    entityId: booking.id,
                    slotEventId,
                    bookingEventId,
                });
                const now = new Date().toISOString();
                await Promise.all([
                    admin
                        .from("bookings")
                        .update({
                            google_calendar_event_id: null,
                            google_calendar_synced_at: now,
                            google_calendar_sync_error: null,
                        })
                        .eq("id", bookingId),
                    slot
                        ? admin
                              .from("availability_slots")
                              .update({
                                  google_calendar_event_id: null,
                                  google_calendar_synced_at: now,
                                  google_calendar_sync_error: null,
                              })
                              .eq("id", slot.id)
                        : Promise.resolve(),
                ]);
            }
            await recordIntegrationSuccess(integration.id);
            return { status: "synced" };
        }

        if (!slot) {
            throw new Error("Booking has no appointment time.");
        }
        if (!["confirmed", "completed", "no_show"].includes(booking.status)) {
            return syncAvailabilitySlotToGoogleCalendar(slot.id);
        }

        const displayName =
            booking.profiles?.display_name ??
            booking.client_display_name ??
            "Client";
        const email = booking.profiles?.email ?? booking.client_email;
        const instagram =
            booking.profiles?.instagram_handle ??
            booking.client_instagram_handle;
        const serviceSummary =
            (booking.booking_line_items ?? [])
                .filter(
                    (item) =>
                        item.active &&
                        !item.removed_at &&
                        item.item_type !== "discount",
                )
                .map((item) => item.label_snapshot)
                .join(" · ") || "Services not listed";
        const calendarServiceTitle = compactCalendarServiceTitle(
            booking.booking_line_items ?? [],
        );
        const statusLabel =
            booking.status === "no_show"
                ? "No-show"
                : booking.status === "completed"
                  ? "Completed"
                  : "Confirmed";
        const event: GoogleCalendarEventInput = {
            summary: `${displayName} · ${calendarServiceTitle}`,
            description: [
                `Booking reference: ${booking.booking_reference}`,
                `Client: ${displayName}`,
                email ? `Email: ${email}` : null,
                instagram
                    ? `Instagram: @${instagram.replace(/^@/, "")}`
                    : null,
                `Services: ${serviceSummary}`,
                `Status: ${statusLabel}`,
            ]
                .filter(Boolean)
                .join("\n"),
            start: {
                dateTime: slot.starts_at,
                timeZone: GOOGLE_CALENDAR_TIME_ZONE,
            },
            end: {
                dateTime: resolveGoogleCalendarEventEndTime({
                    startsAt: slot.starts_at,
                    endsAt: slot.ends_at,
                }),
                timeZone: GOOGLE_CALENDAR_TIME_ZONE,
            },
            transparency: "opaque",
            status: "confirmed",
            reminders: {
                useDefault: false,
                overrides: [
                    { method: "popup", minutes: 1440 },
                    { method: "popup", minutes: 30 },
                ],
            },
        };
        const googleEvent = await upsertLifecycleEvent({
            accessToken,
            integration,
            entityId: booking.id,
            slotEventId,
            bookingEventId,
            fallbackEventId: slot
                ? deterministicEventId("slot", slot.id)
                : deterministicEventId("booking", booking.id),
            event,
        });
        const now = new Date().toISOString();
        await Promise.all([
            admin
                .from("bookings")
                .update({
                    google_calendar_event_id: googleEvent.id,
                    google_calendar_synced_at: now,
                    google_calendar_sync_error: null,
                })
                .eq("id", bookingId),
            admin
                .from("availability_slots")
                .update({
                    google_calendar_event_id: googleEvent.id,
                    google_calendar_synced_at: now,
                    google_calendar_sync_error: null,
                })
                .eq("id", slot.id),
        ]);
        await recordIntegrationSuccess(integration.id);
        return { status: "synced" };
    } catch (error) {
        const safeError = safeSyncError(error);
        logSyncError("booking", bookingId, error);
        await Promise.all([
            admin
                .from("bookings")
                .update({ google_calendar_sync_error: safeError })
                .eq("id", bookingId),
            recordIntegrationFailure(safeError),
        ]);
        return { status: "failed" };
    }
}
