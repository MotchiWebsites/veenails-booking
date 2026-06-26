import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Enums } from "@/types/supabase";

type SlotRow = Pick<
    Database["public"]["Tables"]["availability_slots"]["Row"],
    "id" | "starts_at" | "ends_at" | "status" | "active" | "notes" | "created_at"
> & {
    regulars_first: boolean;
    public_access_at: string;
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
};

export async function getAdminAvailabilitySlots() {
    await requireAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from("availability_slots")
        .select("id, starts_at, ends_at, status, active, notes, created_at, regulars_first, public_access_at")
        .order("starts_at", { ascending: false })
        .limit(240)
        .overrideTypes<SlotRow[]>();

    if (error) {
        console.error("[admin:availability:list]", error);
        throw new Error("We couldn't load availability.");
    }

    return (data ?? []).map((slot) => ({
        id: slot.id,
            startsAt: slot.starts_at,
            endsAt: slot.ends_at,
            regularsFirst: slot.regulars_first,
            publicAccessAt: slot.public_access_at,
        status: slot.status,
        active: slot.active,
        notes: slot.notes,
        createdAt: slot.created_at,
    }));
}
