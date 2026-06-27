import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Enums } from "@/types/supabase";

export type AdminCreateProfileOption = {
    id: string;
    displayName: string;
    email: string;
    instagramHandle: string | null;
};

export type AdminCreateSlotOption = {
    id: string;
    startsAt: string;
    endsAt: string | null;
};

export type AdminCreateDesignTierOption = {
    id: string;
    label: string;
    description?: string;
    price: number;
    imageSrc: null;
    imageAlt: string;
};

export type AdminCreateSettings = {
    depositAmount: number;
    bookingFeeMode: Enums<"fee_mode">;
    bookingFeeRate: number;
    holdMinutes: number;
};

type ProfileRow = Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "id" | "display_name" | "email" | "instagram_handle"
>;

type SlotRow = Pick<
    Database["public"]["Tables"]["availability_slots"]["Row"],
    "id" | "starts_at" | "ends_at"
>;

type DesignTierRow = Pick<
    Database["public"]["Tables"]["design_tiers"]["Row"],
    "id" | "name" | "description" | "price"
>;

type SettingsRow = Pick<
    Database["public"]["Tables"]["booking_settings"]["Row"],
    "deposit_amount" | "booking_fee_mode" | "booking_fee_rate" | "hold_minutes"
>;

export async function getAdminCreateAppointmentData() {
    await requireAdmin();
    const admin = createAdminClient();
    const now = new Date().toISOString();

    const [profilesResult, slotsResult, designTiersResult, settingsResult] =
        await Promise.all([
            admin
                .from("profiles")
                .select("id, display_name, email, instagram_handle")
                .order("display_name", { ascending: true })
                .limit(250)
                .overrideTypes<ProfileRow[]>(),
            admin
                .from("availability_slots")
                .select("id, starts_at, ends_at")
                .eq("active", true)
                .eq("status", "available")
                .gte("starts_at", now)
                .order("starts_at", { ascending: true })
                .limit(180)
                .overrideTypes<SlotRow[]>(),
            admin
                .from("design_tiers")
                .select("id, name, description, price")
                .eq("active", true)
                .order("display_order", { ascending: true })
                .overrideTypes<DesignTierRow[]>(),
            admin
                .from("booking_settings")
                .select(
                    "deposit_amount, booking_fee_mode, booking_fee_rate, hold_minutes",
                )
                .eq("id", 1)
                .maybeSingle()
                .overrideTypes<SettingsRow | null>(),
        ]);

    if (
        profilesResult.error ||
        slotsResult.error ||
        designTiersResult.error ||
        settingsResult.error
    ) {
        console.error(
            "[admin:create-appointment:data]",
            profilesResult.error ??
                slotsResult.error ??
                designTiersResult.error ??
                settingsResult.error,
        );
        throw new Error("We couldn't load appointment creation options.");
    }

    return {
        profiles: (profilesResult.data ?? []).map((profile) => ({
            id: profile.id,
            displayName: profile.display_name,
            email: profile.email,
            instagramHandle: profile.instagram_handle,
        })),
        slots: (slotsResult.data ?? []).map((slot) => ({
            id: slot.id,
            startsAt: slot.starts_at,
            endsAt: slot.ends_at,
        })),
        designTiers: (designTiersResult.data ?? []).map((tier) => ({
            id: tier.id,
            label: tier.name,
            description: tier.description ?? undefined,
            price: Number(tier.price ?? 0),
            imageSrc: null,
            imageAlt: `${tier.name} design tier preview`,
        })),
        settings: settingsResult.data
            ? {
                  depositAmount: Number(settingsResult.data.deposit_amount ?? 0),
                  bookingFeeMode: settingsResult.data.booking_fee_mode,
                  bookingFeeRate: Number(
                      settingsResult.data.booking_fee_rate ?? 0,
                  ),
                  holdMinutes: Number(settingsResult.data.hold_minutes ?? 0),
              }
            : {
                  depositAmount: 0,
                  bookingFeeMode: "added_on_top" as const,
                  bookingFeeRate: 0,
                  holdMinutes: 0,
              },
    };
}
