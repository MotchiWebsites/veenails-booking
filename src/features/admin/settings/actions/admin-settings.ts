"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/supabase";

export type AdminSettingsActionState = {
    error: string;
    success: string;
};

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
    const regularEarlyAccessHours = numberFromForm(
        formData,
        "regularEarlyAccessHours",
    );
    const bookingFeeMode = String(
        formData.get("bookingFeeMode") ?? "added_on_top",
    ) as Enums<"fee_mode">;
    const etransferEmail =
        String(formData.get("etransferEmail") ?? "").trim() || null;
    const instagramUrl =
        String(formData.get("instagramUrl") ?? "").trim() || null;
    const studioAddress =
        String(formData.get("studioAddress") ?? "").trim() || null;
    const studioBuzzerCode =
        String(formData.get("studioBuzzerCode") ?? "").trim() || null;

    if (
        !id ||
        depositAmount === null ||
        bookingFeeRate === null ||
        holdMinutes === null ||
        regularEarlyAccessHours === null
    ) {
        return {
            error: "Booking settings are incomplete.",
            success: "",
        };
    }
    if (
        depositAmount < 0 ||
        bookingFeeRate < 0 ||
        holdMinutes < 1 ||
        regularEarlyAccessHours < 0 ||
        regularEarlyAccessHours > 168
    ) {
        return {
            error: "Booking settings contain an invalid value.",
            success: "",
        };
    }
    if (
        depositAmount < 0 ||
        bookingFeeRate < 0 ||
        holdMinutes < 1 ||
        regularEarlyAccessHours < 0 ||
        regularEarlyAccessHours > 168
    ) {
        throw new Error("Booking settings contain an invalid value.");
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
            regular_early_access_hours: regularEarlyAccessHours,
            studio_address: studioAddress,
            studio_buzzer_code: studioBuzzerCode,
        })
        .eq("id", id);

    if (error) {
        console.error("[admin:settings:update]", error);
        return {
            error: "We couldn't update booking settings.",
            success: "",
        };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/book");
    revalidatePath("/book/checkout");
    revalidatePath("/booking");
    revalidatePath("/dashboard");

    return {
        error: "",
        success: "Settings saved.",
    };
}
