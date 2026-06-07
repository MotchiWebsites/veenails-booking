import { createClient } from "@/lib/supabase/server";
import type { DashboardOverviewData } from "@/features/dashboard/types/dashboard";

function getFallbackDisplayName(email?: string | null) {
    return email?.split("@")[0] || "Client";
}

export async function getDashboardOverviewData(
    userId: string,
): Promise<DashboardOverviewData> {
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", userId)
        .single();

    const [pendingBookings, confirmedBookings, availableCredits] =
        await Promise.all([
            supabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "pending"),

            supabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "confirmed"),

            supabase
                .from("credits")
                .select("amount")
                .eq("user_id", userId)
                .eq("status", "available"),
        ]);

    const creditTotal =
        availableCredits.data?.reduce(
            (total, credit) => total + Number(credit.amount || 0),
            0,
        ) ?? 0;

    return {
        profile: {
            displayName:
                profile?.display_name || getFallbackDisplayName(profile?.email),
            email: profile?.email || "",
        },
        stats: {
            pendingRequests: pendingBookings.count ?? 0,
            confirmedBookings: confirmedBookings.count ?? 0,
            availableCredits: creditTotal,
        },
    };
}
