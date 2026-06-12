import { createClient } from "@/lib/supabase/server";
import type {
    BookingSettingsSummary,
    DesignTier,
} from "@/features/bookings/new-booking/types";
import type { Database } from "@/types/supabase";

export type BookingCheckoutSettings = NonNullable<BookingSettingsSummary> & {
    etransferEmail: string | null;
};

type SettingsRow = Pick<
    Database["public"]["Tables"]["booking_settings"]["Row"],
    | "deposit_amount"
    | "booking_fee_mode"
    | "booking_fee_rate"
    | "hold_minutes"
    | "etransfer_email"
>;

type DesignTierRow = Pick<
    Database["public"]["Tables"]["design_tiers"]["Row"],
    "id" | "name" | "description" | "price" | "display_order"
>;

export async function getBookingCheckoutPageData(): Promise<{
    settings: BookingCheckoutSettings | null;
    designTiers: DesignTier[];
    userEmail: string | null;
}> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const [settingsResult, designTiersResult, profileResult] = await Promise.all([
        supabase
            .from("booking_settings")
            .select(
                "deposit_amount, booking_fee_mode, booking_fee_rate, hold_minutes, etransfer_email",
            )
            .eq("id", 1)
            .eq("active", true)
            .maybeSingle()
            .overrideTypes<SettingsRow | null>(),

        supabase
            .from("design_tiers")
            .select("id, name, description, price, display_order")
            .eq("active", true)
            .order("display_order", { ascending: true })
            .overrideTypes<DesignTierRow[]>(),

        user
            ? supabase
                  .from("profiles")
                  .select("email")
                  .eq("id", user.id)
                  .maybeSingle()
                  .overrideTypes<{ email: string | null } | null>()
            : Promise.resolve({ data: null, error: null }),
    ]);

    if (settingsResult.error) {
        console.error(
            "[bookings:checkout.booking-settings]",
            settingsResult.error,
        );
        throw new Error("We couldn't load checkout settings right now.");
    }

    if (designTiersResult.error) {
        console.error(
            "[bookings:checkout.design-tiers]",
            designTiersResult.error,
        );
        throw new Error("We couldn't load design tier details right now.");
    }

    if (profileResult.error) {
        console.error("[bookings:checkout.profile]", profileResult.error);
    }

    return {
        settings: settingsResult.data
            ? {
                  depositAmount: Number(settingsResult.data.deposit_amount ?? 0),
                  bookingFeeMode: settingsResult.data.booking_fee_mode,
                  bookingFeeRate: Number(
                      settingsResult.data.booking_fee_rate ?? 0,
                  ),
                  holdMinutes: Number(settingsResult.data.hold_minutes ?? 0),
                  etransferEmail: settingsResult.data.etransfer_email,
              }
            : null,
        designTiers: (designTiersResult.data ?? []).map((tier) => ({
            id: tier.id,
            label: tier.name,
            description: tier.description,
            price: Number(tier.price ?? 0),
            imageSrc: null,
            imageAlt: `${tier.name} design tier preview`,
        })),
        userEmail: profileResult.data?.email ?? user?.email ?? null,
    };
}
