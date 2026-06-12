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

    const [
        pendingBookings,
        confirmedBookings,
        creditsPageData,
        availabilityResult,
    ] = await Promise.all([
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

        supabase
            .from("availability_slots")
            .select("id, starts_at, ends_at, status, active")
            .eq("active", true)
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true }),
    ]);

    if (pendingBookings.error) {
        throwDashboardDataError("pending-bookings", pendingBookings.error);
    }

    if (confirmedBookings.error) {
        throwDashboardDataError("confirmed-bookings", confirmedBookings.error);
    }

    if (availabilityResult.error) {
        throwDashboardDataError("availability", availabilityResult.error);
    }

    const profileEmail = profile?.email ?? fallbackEmail ?? "";
    const days = buildAvailabilityDays(availabilityResult.data ?? []);

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
        availability: {
            days,
        },
    };
}

function buildAvailabilityDays(
    slots: Array<{
        id: string;
        starts_at: string;
        ends_at: string;
        status: string;
    }>,
) {
    const now = new Date();
    const dayMap = new Map<
        string,
        {
            date: string;
            label: string;
            slots: {
                id: string;
                startsAt: string;
                endsAt: string;
                available: boolean;
            }[];
        }
    >();

    for (let offset = 0; offset < 21; offset += 1) {
        const date = new Date(now);
        date.setDate(now.getDate() + offset);
        const key = date.toISOString().slice(0, 10);

        dayMap.set(key, {
            date: key,
            label: date.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
            }),
            slots: [],
        });
    }

    for (const slot of slots) {
        const dateKey = slot.starts_at.slice(0, 10);
        const day = dayMap.get(dateKey);

        if (!day) {
            continue;
        }

        day.slots.push({
            id: slot.id,
            startsAt: slot.starts_at,
            endsAt: slot.ends_at,
            available: slot.status === "available",
        });
    }

    return Array.from(dayMap.values());
}
