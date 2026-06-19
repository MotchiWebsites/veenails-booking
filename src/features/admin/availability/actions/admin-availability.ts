"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/supabase";

const EDITABLE_STATUSES: Enums<"slot_status">[] = ["available", "blocked"];

function parseSlotDate(formData: FormData, timeKey: string) {
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get(timeKey) ?? "");
    const offset = Number(formData.get("timezoneOffset") ?? 0);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        throw new Error("Choose a valid date and time.");
    }

    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    if (minute % 15 !== 0 || hour > 23 || minute > 59) {
        throw new Error("Times must use 15-minute increments.");
    }

    return new Date(Date.UTC(year, month - 1, day, hour, minute) + offset * 60_000);
}

async function assertNoOverlap(
    admin: ReturnType<typeof createAdminClient>,
    startsAt: Date,
    endsAt: Date,
    excludedSlotId?: string,
) {
    let query = admin
        .from("availability_slots")
        .select("id")
        .eq("active", true)
        .lt("starts_at", endsAt.toISOString())
        .gt("ends_at", startsAt.toISOString())
        .limit(1);

    if (excludedSlotId) query = query.neq("id", excludedSlotId);
    const { data, error } = await query;
    if (error) throw error;
    if (data?.length) throw new Error("That time overlaps another active slot.");
}

export async function createAvailabilitySlotAction(formData: FormData) {
    const { user } = await requireAdmin();
    const startsAt = parseSlotDate(formData, "startTime");
    const endsAt = parseSlotDate(formData, "endTime");
    const status = String(formData.get("status") ?? "available") as Enums<"slot_status">;
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (startsAt >= endsAt || startsAt < new Date()) {
        throw new Error("Choose a valid start and end time.");
    }

    if (!EDITABLE_STATUSES.includes(status)) throw new Error("Invalid slot status.");

    const admin = createAdminClient();
    await assertNoOverlap(admin, startsAt, endsAt);
    const { error } = await admin.from("availability_slots").insert({
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status,
        notes,
        created_by: user.id,
    });

    if (error) {
        console.error("[admin:availability:create]", error);
        throw new Error("We couldn't create that availability slot.");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/availability");
}

export async function updateAvailabilitySlotAction(formData: FormData) {
    await requireAdmin();
    const slotId = String(formData.get("slotId") ?? "");
    const startsAt = parseSlotDate(formData, "startTime");
    const endsAt = parseSlotDate(formData, "endTime");
    const status = String(formData.get("status") ?? "available") as Enums<"slot_status">;
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!slotId || startsAt >= endsAt || startsAt < new Date()) {
        throw new Error("Choose a valid future time range.");
    }
    if (!EDITABLE_STATUSES.includes(status)) throw new Error("Invalid slot status.");

    const admin = createAdminClient();
    await assertNoOverlap(admin, startsAt, endsAt, slotId);
    const { data, error } = await admin
        .from("availability_slots")
        .update({ starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), status, notes })
        .eq("id", slotId)
        .eq("active", true)
        .in("status", EDITABLE_STATUSES)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        if (error) console.error("[admin:availability:update]", error);
        throw new Error("Only open or blocked future slots can be edited.");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/availability");
}

export async function deactivateAvailabilitySlotAction(formData: FormData) {
    await requireAdmin();
    const slotId = String(formData.get("slotId") ?? "");

    if (!slotId) return;

    const admin = createAdminClient();
    const { error } = await admin
        .from("availability_slots")
        .update({ active: false })
        .eq("id", slotId)
        .eq("status", "available");

    if (error) {
        console.error("[admin:availability:deactivate]", error);
        throw new Error("We couldn't deactivate that slot.");
    }

    revalidatePath("/admin/availability");
}
