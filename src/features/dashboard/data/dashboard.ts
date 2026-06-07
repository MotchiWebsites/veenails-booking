import { createClient } from "@/lib/supabase/server";
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

    const [pendingBookings, confirmedBookings, availableCredits] =
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

            supabase
                .from("user_credits")
                .select("amount")
                .eq("user_id", userId)
                .eq("active", true)
                .is("expires_at", null)
                .is("used_at", null),
        ]);

    if (pendingBookings.error) {
        throwDashboardDataError("pending-bookings", pendingBookings.error);
    }

    if (confirmedBookings.error) {
        throwDashboardDataError("confirmed-bookings", confirmedBookings.error);
    }

    if (availableCredits.error) {
        throwDashboardDataError("available-credits", availableCredits.error);
    }

    const profileEmail = profile?.email ?? fallbackEmail ?? "";

    const creditTotal =
        availableCredits.data?.reduce(
            (total, credit) => total + Number(credit.amount || 0),
            0,
        ) ?? 0;
    
    return {
        profile: {
            displayName:
                profile?.display_name || getFallbackDisplayName(profileEmail),
            email: profileEmail,
        },
        stats: {
            pendingRequests: pendingBookings.count ?? 0,
            confirmedBookings: confirmedBookings.count ?? 0,
            availableCredits: creditTotal,
        },
    };
}
