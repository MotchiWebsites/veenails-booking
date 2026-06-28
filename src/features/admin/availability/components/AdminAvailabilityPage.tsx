import AvailabilitySlotForm from "@/features/admin/availability/components/AvailabilitySlotForm";
import type { AdminAvailabilitySlot } from "@/features/admin/availability/data/admin-availability";
import AdminEmptyState from "@/features/admin/components/AdminEmptyState";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import AvailabilitySlotCard from "@/features/admin/availability/components/AvailabilitySlotCard";

function SlotList({
    slots,
    regularEarlyAccessHours,
    history = false,
}: {
    slots: AdminAvailabilitySlot[];
    regularEarlyAccessHours: number;
    history?: boolean;
}) {
    if (!slots.length)
        return (
            <AdminEmptyState
                message={
                    history
                        ? "No past availability yet."
                        : "No future availability yet."
                }
            />
        );

    return slots.map((slot) => (
        <AvailabilitySlotCard
            key={slot.id}
            slot={slot}
            regularEarlyAccessHours={regularEarlyAccessHours}
            history={history}
        />
    ));
}

export default function AdminAvailabilityPage({
    slots,
    regularEarlyAccessHours,
    nowIso,
}: {
    slots: AdminAvailabilitySlot[];
    regularEarlyAccessHours: number;
    nowIso: string;
}) {
    const now = new Date(nowIso).getTime();
    const future = slots
        .filter(
            (slot) => slot.active && new Date(slot.startsAt).getTime() >= now,
        )
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    const inactive = slots
        .filter(
            (slot) => !slot.active && new Date(slot.startsAt).getTime() >= now,
        )
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    const past = slots.filter(
        (slot) => new Date(slot.startsAt).getTime() < now,
    );

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <AdminPageHeader
                    eyebrow="Admin"
                    title="Availability"
                    description="Add open hours or block time without wrestling a browser date picker."
                />
                <AvailabilitySlotForm
                    regularEarlyAccessHours={regularEarlyAccessHours}
                />
            </section>
            <section className="space-y-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Future availability
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Open, booked, and blocked time coming up.
                    </p>
                </div>
                <SlotList
                    slots={future}
                    regularEarlyAccessHours={regularEarlyAccessHours}
                />
            </section>
            <details className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <summary className="cursor-pointer font-semibold text-foreground">
                    Inactive / deactivated{" "}
                    <span className="ml-2 text-sm font-normal text-muted">
                        {inactive.length} slots
                    </span>
                </summary>
                <div className="mt-4 space-y-3">
                    <SlotList
                        slots={inactive}
                        regularEarlyAccessHours={regularEarlyAccessHours}
                        history
                    />
                </div>
            </details>
            <details className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <summary className="cursor-pointer font-semibold text-foreground">
                    Past availability{" "}
                    <span className="ml-2 text-sm font-normal text-muted">
                        {past.length} slots
                    </span>
                </summary>
                <div className="mt-4 space-y-3">
                    <SlotList
                        slots={past}
                        regularEarlyAccessHours={regularEarlyAccessHours}
                        history
                    />
                </div>
            </details>
        </div>
    );
}
