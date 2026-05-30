import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/money";
import type {
    BookingSettingsRow,
    DesignTierRow,
    PolicyRow,
    PricingGroupRow,
    PricingItemRow,
    PricingVariantRow,
} from "@/types/db";
import type { LandingData, LandingPricingCard } from "@/types/landing";

export async function getLandingData(): Promise<LandingData> {
    const supabase = await createClient();

    const [
        settingsResult,
        groupsResult,
        itemsResult,
        variantsResult,
        designTiersResult,
        policiesResult,
    ] = await Promise.all([
        supabase
            .from("booking_settings")
            .select(
                "deposit_amount, booking_fee_rate, booking_fee_mode, hold_minutes, etransfer_email, instagram_url",
            )
            .eq("id", 1)
            .single(),

        supabase
            .from("pricing_groups")
            .select("id, slug, title, description, display_order")
            .eq("active", true)
            .order("display_order", { ascending: true }),

        supabase
            .from("pricing_items")
            .select("id, group_id, name, description, display_order")
            .eq("active", true)
            .order("display_order", { ascending: true }),

        supabase
            .from("pricing_variants")
            .select("id, item_id, label, price, display_order")
            .eq("active", true)
            .order("display_order", { ascending: true }),

        supabase
            .from("design_tiers")
            .select("id, name, description, price, display_order")
            .eq("active", true)
            .order("display_order", { ascending: true }),

        supabase
            .from("policies")
            .select("id, title, description, display_order")
            .eq("active", true)
            .eq("policy_type", "booking")
            .order("display_order", { ascending: true }),
    ]);

    if (settingsResult.error) {
        throw new Error(
            `Failed to load booking settings: ${settingsResult.error.message}`,
        );
    }

    if (groupsResult.error) {
        throw new Error(
            `Failed to load pricing groups: ${groupsResult.error.message}`,
        );
    }

    if (itemsResult.error) {
        throw new Error(
            `Failed to load pricing items: ${itemsResult.error.message}`,
        );
    }

    if (variantsResult.error) {
        throw new Error(
            `Failed to load pricing variants: ${variantsResult.error.message}`,
        );
    }

    if (designTiersResult.error) {
        throw new Error(
            `Failed to load design tiers: ${designTiersResult.error.message}`,
        );
    }

    if (policiesResult.error) {
        throw new Error(
            `Failed to load policies: ${policiesResult.error.message}`,
        );
    }

    const settings = settingsResult.data as BookingSettingsRow;
    const groups = (groupsResult.data ?? []) as PricingGroupRow[];
    const items = (itemsResult.data ?? []) as PricingItemRow[];
    const variants = (variantsResult.data ?? []) as PricingVariantRow[];
    const designTiers = (designTiersResult.data ?? []) as DesignTierRow[];
    const policies = (policiesResult.data ?? []) as PolicyRow[];

    return {
        settings: {
            depositAmount: Number(settings.deposit_amount),
            bookingFeeRate: Number(settings.booking_fee_rate),
            bookingFeeMode: settings.booking_fee_mode,
            holdMinutes: settings.hold_minutes,
            etransferEmail: settings.etransfer_email,
            instagramUrl: settings.instagram_url,
        },
        pricingCards: buildPricingCards(groups, items, variants, designTiers),
        policies: policies.map((policy) => ({
            id: policy.id,
            title: policy.title,
            description: policy.description,
        })),
    };
}

function buildPricingCards(
    groups: PricingGroupRow[],
    items: PricingItemRow[],
    variants: PricingVariantRow[],
    designTiers: DesignTierRow[],
): LandingPricingCard[] {
    const serviceCards = groups.map((group) => {
        const groupItems = items.filter((item) => item.group_id === group.id);
        const itemIds = groupItems.map((item) => item.id);
        const groupVariants = variants.filter((variant) =>
            itemIds.includes(variant.item_id),
        );

        const prices = groupVariants
            .map((variant) => Number(variant.price))
            .filter(Number.isFinite);

        return {
            id: group.id,
            title: group.title,
            description:
                group.description ||
                "Options and pricing are shown clearly during booking.",
            priceLabel: formatPriceRange(prices),
        };
    });

    const designPrices = designTiers
        .map((tier) => Number(tier.price))
        .filter(Number.isFinite);

    const designCard: LandingPricingCard | null =
        designPrices.length > 0
            ? {
                  id: "design-levels",
                  title: "Design Levels",
                  description:
                      "Choose your tier based on detail, charms, 3D work, and overall complexity.",
                  priceLabel: `+${formatPriceRange(designPrices)}`,
              }
            : null;

    return [...serviceCards, ...(designCard ? [designCard] : [])];
}

function formatPriceRange(prices: number[]) {
    if (prices.length === 0) {
        return "View pricing";
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) {
        return formatCurrency(min);
    }

    return `${formatCurrency(min)}–${formatCurrency(max)}`;
}
