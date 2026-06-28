import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Enums } from "@/types/supabase";

type SlotRow = Pick<
    Database["public"]["Tables"]["availability_slots"]["Row"],
    "id" | "starts_at" | "ends_at" | "status" | "active" | "notes" | "created_at"
> & {
    regulars_first: boolean;
    public_access_at: string;
    bookings:
        | Array<
              Pick<
                  Database["public"]["Tables"]["bookings"]["Row"],
                  "id" | "status" | "created_at"
              >
          >
        | null;
};

export type AdminAvailabilitySlot = {
    id: string;
    startsAt: string;
    endsAt: string | null;
    regularsFirst: boolean;
    publicAccessAt: string;
    status: Enums<"slot_status">;
    active: boolean;
    notes: string | null;
    createdAt: string;
    canReleasePriority: boolean;
    bookingId: string | null;
};

export async function getAdminAvailabilityPageData() {
    await requireAdmin();
    const admin = createAdminClient();

    const [slotsResult, settingsResult] = await Promise.all([
        admin
            .from("availability_slots")
            .select(
                "id, starts_at, ends_at, status, active, notes, created_at, regulars_first, public_access_at, bookings:bookings!bookings_slot_id_fkey(id, status, created_at)",
            )
            .order("starts_at", { ascending: false })
            .limit(240)
            .overrideTypes<SlotRow[]>(),
        admin
            .from("booking_settings")
            .select("regular_early_access_hours")
            .eq("id", 1)
            .maybeSingle()
            .overrideTypes<{ regular_early_access_hours: number } | null>(),
    ]);

    if (slotsResult.error || settingsResult.error) {
        console.error(
            "[admin:availability:data]",
            slotsResult.error ?? settingsResult.error,
        );
        throw new Error("We couldn't load availability.");
    }

    const now = Date.now();

    return {
        slots: (slotsResult.data ?? []).map((slot) => {
            const latestBooking =
                slot.bookings
                    ?.slice()
                    .sort(
                        (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime(),
                    )[0] ?? null;
            const occupied = !["available", "blocked"].includes(slot.status);

            return {
                id: slot.id,
                startsAt: slot.starts_at,
                endsAt: slot.ends_at,
                regularsFirst: slot.regulars_first,
                publicAccessAt: slot.public_access_at,
                status: slot.status,
                active: slot.active,
                notes: slot.notes,
                createdAt: slot.created_at,
                canReleasePriority:
                    slot.active &&
                    slot.status === "available" &&
                    slot.regulars_first &&
                    new Date(slot.starts_at).getTime() > now &&
                    new Date(slot.public_access_at).getTime() > now,
                bookingId: occupied ? latestBooking?.id ?? null : null,
            };
        }),
        regularEarlyAccessHours: Math.max(
            0,
            Number(settingsResult.data?.regular_early_access_hours ?? 24),
        ),
    };
}
