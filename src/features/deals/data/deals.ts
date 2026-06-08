import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/money";
import type { DealRedemptionRow, DealRow } from "@/types/db";

export type DealStatusTone = "active" | "claimed" | "applied";

export type DealView = {
    id: string;
    code: string;
    title: string;
    description: string | null;
    valueLabel: string;
    bannerLabel: string;
    windowLabel: string | null;
    maxUsesLabel: string | null;
    statusTone: DealStatusTone;
    statusLabel: string;
    hasRedemption: boolean;
};

export async function getActiveDeals(userId?: string | null) {
    noStore();

    const supabase = await createClient();

    const dealsResult = await supabase
        .from("deals")
        .select(
            "id, code, title, description, discount_type, discount_value, starts_at, ends_at, max_uses",
        )
        .eq("active", true)
        .order("ends_at", { ascending: true });

    if (dealsResult.error) {
        throw new Error(`Failed to load deals: ${dealsResult.error.message}`);
    }

    const deals = (dealsResult.data ?? []) as DealRow[];

    if (!userId || deals.length === 0) {
        return deals.map((deal) => mapDealView(deal));
    }

    const dealIds = deals.map((deal) => deal.id);

    const redemptionsResult = await supabase
        .from("deal_redemptions")
        .select("deal_id, status")
        .eq("user_id", userId)
        .in("deal_id", dealIds);

    if (redemptionsResult.error) {
        throw new Error(
            `Failed to load deal redemptions: ${redemptionsResult.error.message}`,
        );
    }

    const redemptions = (redemptionsResult.data ?? []) as Pick<
        DealRedemptionRow,
        "deal_id" | "status"
    >[];

    const redemptionsByDealId = new Map<
        string,
        Pick<DealRedemptionRow, "deal_id" | "status">[]
    >();

    redemptions.forEach((redemption) => {
        const existing = redemptionsByDealId.get(redemption.deal_id) ?? [];
        existing.push(redemption);
        redemptionsByDealId.set(redemption.deal_id, existing);
    });

    return deals.map((deal) =>
        mapDealView(deal, redemptionsByDealId.get(deal.id) ?? []),
    );
}

function mapDealView(
    deal: DealRow,
    redemptions: Pick<DealRedemptionRow, "deal_id" | "status">[] = [],
): DealView {
    const appliedRedemption = redemptions.find(
        (redemption) => redemption.status === "applied",
    );
    const claimedRedemption = redemptions.find(
        (redemption) => redemption.status === "claimed",
    );

    let statusTone: DealStatusTone = "active";
    let statusLabel = "Available now";

    if (appliedRedemption) {
        statusTone = "applied";
        statusLabel = "Applied to booking";
    } else if (claimedRedemption) {
        statusTone = "claimed";
        statusLabel = "Claimed on your account";
    }

    return {
        id: deal.id,
        code: deal.code,
        title: deal.title,
        description: deal.description,
        valueLabel: formatDealValue(deal),
        bannerLabel: buildBannerLabel(deal),
        windowLabel: formatDealWindow(deal),
        maxUsesLabel:
            typeof deal.max_uses === "number"
                ? `${deal.max_uses} total redemptions available`
                : null,
        statusTone,
        statusLabel,
        hasRedemption: statusTone !== "active",
    };
}

function formatDealValue(deal: DealRow) {
    const value = deal.discount_value;

    if (deal.discount_type === "percentage" && typeof value === "number") {
        return `${formatNumber(value)}% off`;
    }

    if (deal.discount_type === "fixed_amount" && typeof value === "number") {
        return `${formatCurrency(value)} off`;
    }

    return "Limited-time offer";
}

function buildBannerLabel(deal: DealRow) {
    const valueLabel = formatDealValue(deal);
    const timeframe = formatDealTimeframe(deal);

    if (timeframe) {
        return `We're running ${valueLabel.toLowerCase()} ${timeframe}.`;
    }

    return `We're running ${valueLabel.toLowerCase()} right now.`;
}

function formatDealWindow(deal: DealRow) {
    if (!deal.starts_at && !deal.ends_at) {
        return null;
    }

    if (deal.starts_at && deal.ends_at) {
        return `${formatDate(deal.starts_at)} - ${formatDate(deal.ends_at)}`;
    }

    if (deal.ends_at) {
        return `Ends ${formatDate(deal.ends_at)}`;
    }

    return `Started ${formatDate(deal.starts_at as string)}`;
}

function formatDealTimeframe(deal: DealRow) {
    if (!deal.ends_at) {
        return "for a limited time";
    }

    const now = new Date();
    const endsAt = new Date(deal.ends_at);
    const diffInDays = Math.ceil(
        (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays <= 7) {
        return "this week";
    }

    return `until ${formatDate(deal.ends_at)}`;
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-CA", {
        month: "short",
        day: "numeric",
    }).format(new Date(value));
}

function formatNumber(value: number) {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}
