import { createClient } from "@/lib/supabase/server";
import { getCreditsPageData } from "@/features/credits/data/credits";
import type { DashboardOverviewData } from "@/features/dashboard/types/dashboard";

function getFallbackDisplayName(email?: string | null) {
    return email?.split("@")[0] || "Client";
}

function throwDashboardDataError(action: string, error: { message: string }) {
    console.error(`[dashboard:${action}]`, {
        message: error.message,
    });

    throw new Error("We couldn't load your dashboard right now.");
}

export async function getDashboardOverviewData(
    userId: string,
    fallbackEmail?: string | null,
): Promise<DashboardOverviewData> {
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", userId)
        .single();

    if (profileError) {
        throwDashboardDataError("profile", profileError);
    }

    const [pendingBookings, confirmedBookings, creditsPageData] =
        await Promise.all([
            supabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "requested"),

            supabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "confirmed"),

            getCreditsPageData(userId),
        ]);

    if (pendingBookings.error) {
        throwDashboardDataError("pending-bookings", pendingBookings.error);
    }

    if (confirmedBookings.error) {
        throwDashboardDataError("confirmed-bookings", confirmedBookings.error);
    }

    const profileEmail = profile?.email ?? fallbackEmail ?? "";

    return {
        profile: {
            displayName:
                profile?.display_name || getFallbackDisplayName(profileEmail),
            email: profileEmail,
        },
        stats: {
            pendingRequests: pendingBookings.count ?? 0,
            confirmedBookings: confirmedBookings.count ?? 0,
            availableCredits: creditsPageData.totalActiveAmount,
        },
    };
}
