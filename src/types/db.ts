import type { Database } from "@/types/supabase";

type PublicTables = Database["public"]["Tables"];

export type TableRow<T extends keyof PublicTables> = PublicTables[T]["Row"];

export type BookingSettingsRow = TableRow<"booking_settings">;
export type DealRow = TableRow<"deals">;
export type DealRedemptionRow = TableRow<"deal_redemptions">;
export type PricingGroupRow = TableRow<"pricing_groups">;
export type PricingItemRow = TableRow<"pricing_items">;
export type PricingVariantRow = TableRow<"pricing_variants">;
export type DesignTierRow = TableRow<"design_tiers">;
export type PolicyRow = TableRow<"policies">;
