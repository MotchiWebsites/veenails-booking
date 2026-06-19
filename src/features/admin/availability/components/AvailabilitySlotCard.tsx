"use client";

import { useEffect, useState } from "react";
import { FiEdit2, FiX } from "react-icons/fi";
import { deactivateAvailabilitySlotAction } from "@/features/admin/availability/actions/admin-availability";
import EditAvailabilitySlotForm from "@/features/admin/availability/components/EditAvailabilitySlotForm";
import type { AdminAvailabilitySlot } from "@/features/admin/availability/data/admin-availability";
import AdminStatusPill from "@/features/admin/components/AdminStatusPill";
import { formatDateTime } from "@/features/admin/components/admin-formatters";

function friendlyStatus(slot: AdminAvailabilitySlot) {
    if (!slot.active) return "Inactive";
    if (slot.status === "available") return "Open";
    if (slot.status === "blocked") return "Blocked";
    if (slot.status === "confirmed") return "Booked";
    if (slot.status === "held") return "On hold";
    return slot.status.replaceAll("_", " ");
}

export default function AvailabilitySlotCard({
    slot,
    history = false,
}: {
    slot: AdminAvailabilitySlot;
    history?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const canEdit =
        !history &&
        slot.active &&
        (slot.status === "available" || slot.status === "blocked");

    useEffect(() => {
        if (!editing) return;

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setEditing(false);
        }

        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [editing]);

    return (
        <article
            className={`overflow-hidden rounded-2xl border bg-background transition-colors ${
                editing ? "border-dark-green/30" : "border-border/60"
            }`}
        >
            <div className="flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                        {formatDateTime(slot.startsAt)} –{" "}
                        {new Date(slot.endsAt).toLocaleTimeString("en-CA", {
                            hour: "numeric",
                            minute: "2-digit",
                        })}
                    </p>
                    {slot.notes ? (
                        <p className="mt-1 break-words text-sm text-muted">
                            {slot.notes}
                        </p>
                    ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="mb-1 self-start sm:mb-0 sm:self-center">
                        <AdminStatusPill
                            label={friendlyStatus(slot)}
                            tone={!slot.active ? "danger" : "neutral"}
                        />
                    </div>

                    {canEdit ? (
                        <button
                            type="button"
                            onClick={() => setEditing((value) => !value)}
                            aria-expanded={editing}
                            aria-controls={`edit-slot-${slot.id}`}
                            className="btn-secondary inline-flex items-center justify-center gap-2 sm:min-w-[8.5rem]"
                        >
                            {editing ? (
                                <FiX className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <FiEdit2 className="h-4 w-4" aria-hidden="true" />
                            )}
                            {editing ? "Close editor" : "Edit slot"}
                        </button>
                    ) : null}

                    {!history && slot.status === "available" && slot.active ? (
                        <form action={deactivateAvailabilitySlotAction}>
                            <input type="hidden" name="slotId" value={slot.id} />
                            <button type="submit" className="btn-secondary w-full">
                                Deactivate
                            </button>
                        </form>
                    ) : null}
                </div>
            </div>

            {editing ? (
                <EditAvailabilitySlotForm
                    slot={slot}
                    onClose={() => setEditing(false)}
                />
            ) : null}
        </article>
    );
}
