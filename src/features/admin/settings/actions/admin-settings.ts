"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/supabase";

function numberFromForm(formData: FormData, key: string) {
    const value = Number(formData.get(key));
    return Number.isFinite(value) ? value : null;
}

export async function updateBookingSettingsAction(formData: FormData) {
    await requireAdmin();

    const id = numberFromForm(formData, "id");
    const depositAmount = numberFromForm(formData, "depositAmount");
    const bookingFeeRate = numberFromForm(formData, "bookingFeeRate");
    const holdMinutes = numberFromForm(formData, "holdMinutes");
    const bookingFeeMode = String(
        formData.get("bookingFeeMode") ?? "added_on_top",
    ) as Enums<"fee_mode">;
    const etransferEmail =
        String(formData.get("etransferEmail") ?? "").trim() || null;
    const instagramUrl =
        String(formData.get("instagramUrl") ?? "").trim() || null;

    if (!id || depositAmount === null || bookingFeeRate === null || holdMinutes === null) {
        throw new Error("Booking settings are incomplete.");
    }

    const admin = createAdminClient();
    const { error } = await admin
        .from("booking_settings")
        .update({
            deposit_amount: depositAmount,
            booking_fee_rate: bookingFeeRate,
            booking_fee_mode: bookingFeeMode,
            hold_minutes: holdMinutes,
            etransfer_email: etransferEmail,
            instagram_url: instagramUrl,
        })
        .eq("id", id);

    if (error) {
        console.error("[admin:settings:update]", error);
        throw new Error("We couldn't update booking settings.");
    }

    revalidatePath("/admin/settings");
    revalidatePath("/book");
    revalidatePath("/book/checkout");
}
