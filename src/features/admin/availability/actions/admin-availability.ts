"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/supabase";

const EDITABLE_STATUSES: Enums<"slot_status">[] = ["available", "blocked"];

export type AvailabilityActionState = {
    error: string;
    success: string;
    messageId: string;
};

function actionState(
    input: Omit<AvailabilityActionState, "messageId">,
): AvailabilityActionState {
    return {
        ...input,
        messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

function parseSlotDate(formData: FormData, timeKey: string, optional = false) {
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get(timeKey) ?? "");
    const offset = Number(formData.get("timezoneOffset") ?? 0);

    if (optional && !time) {
        return null;
    }

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

function parseRequiredSlotDate(formData: FormData, timeKey: string) {
    const value = parseSlotDate(formData, timeKey);
    if (!value) {
        throw new Error("Choose a valid date and time.");
    }
    return value;
}

async function assertNoOverlap(
    admin: ReturnType<typeof createAdminClient>,
    startsAt: Date,
    endsAt: Date | null,
    excludedSlotId?: string,
) {
    if (!endsAt) {
        return;
    }

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

export async function createAvailabilitySlotAction(
    _previousState: AvailabilityActionState,
    formData: FormData,
): Promise<AvailabilityActionState> {
    try {
        const { user } = await requireAdmin();
        const startsAt = parseRequiredSlotDate(formData, "startTime");
        const endsAt = parseSlotDate(formData, "endTime", true);
        const status = String(formData.get("status") ?? "available") as Enums<"slot_status">;
        const notes = String(formData.get("notes") ?? "").trim() || null;
        const regularsFirst = formData.getAll("regularsFirst").includes("on");

        if ((endsAt && startsAt >= endsAt) || startsAt < new Date()) {
            return actionState({ error: "Choose a valid future start time.", success: "" });
        }

        if (!EDITABLE_STATUSES.includes(status)) {
            return actionState({ error: "Invalid slot status.", success: "" });
        }

        const admin = createAdminClient();
        await assertNoOverlap(admin, startsAt, endsAt);
        const { data: settings } = await admin
            .from("booking_settings")
            .select("regular_early_access_hours")
            .eq("id", 1)
            .maybeSingle()
            .overrideTypes<{ regular_early_access_hours: number } | null>();
        const earlyAccessHours = Math.min(
            48,
            Math.max(0, Number(settings?.regular_early_access_hours ?? 24)),
        );
        const publicAccessAt =
            regularsFirst && status === "available"
                ? new Date(Date.now() + earlyAccessHours * 60 * 60 * 1000)
                : new Date();
        const { error } = await admin.from("availability_slots").insert({
            starts_at: startsAt.toISOString(),
            ends_at: endsAt?.toISOString() ?? null,
            status,
            notes,
            created_by: user.id,
            regulars_first: regularsFirst && status === "available",
            public_access_at: publicAccessAt.toISOString(),
        });

        if (error) {
            console.error("[admin:availability:create]", error);
            return actionState({ error: "We couldn't create that availability slot.", success: "" });
        }

        revalidatePath("/admin");
        revalidatePath("/admin/availability");

        return actionState({ error: "", success: "Availability added." });
    } catch (error) {
        console.error("[admin:availability:create]", error);
        return actionState({ error: error instanceof Error ? error.message : "We couldn't create that availability slot.", success: "" });
    }
}

export async function updateAvailabilitySlotAction(formData: FormData) {
    await requireAdmin();
    const slotId = String(formData.get("slotId") ?? "");
    const startsAt = parseRequiredSlotDate(formData, "startTime");
    const endsAt = parseSlotDate(formData, "endTime", true);
    const status = String(formData.get("status") ?? "available") as Enums<"slot_status">;
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!slotId || (endsAt && startsAt >= endsAt) || startsAt < new Date()) {
        throw new Error("Choose a valid future start time.");
    }
    if (!EDITABLE_STATUSES.includes(status)) throw new Error("Invalid slot status.");

    const admin = createAdminClient();
    await assertNoOverlap(admin, startsAt, endsAt, slotId);
    const { data, error } = await admin
        .from("availability_slots")
        .update({ starts_at: startsAt.toISOString(), ends_at: endsAt?.toISOString() ?? null, status, notes })
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
