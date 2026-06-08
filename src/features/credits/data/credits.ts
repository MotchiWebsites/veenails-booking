import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import {
    getCreditStatus,
    isAvailableCredit,
    type UserCreditRow,
} from "@/features/credits/lib/credits";

type BookingSummary = Pick<
    Database["public"]["Tables"]["bookings"]["Row"],
    "id" | "booking_reference"
>;

export type CreditRecord = UserCreditRow & {
    source_booking: BookingSummary | null;
};

export type CreditsPageData = {
    activeCredits: CreditRecord[];
    historicalCredits: CreditRecord[];
    totalActiveAmount: number;
    activeCount: number;
    historicalCount: number;
};

function throwCreditsError(action: string, error: { message: string }) {
    console.error(`[credits:${action}]`, {
        message: error.message,
    });

    throw new Error("We couldn't load your credits right now.");
}

function sortActiveCredits(a: CreditRecord, b: CreditRecord) {
    const aExpiry = a.expires_at ? new Date(a.expires_at).getTime() : Number.POSITIVE_INFINITY;
    const bExpiry = b.expires_at ? new Date(b.expires_at).getTime() : Number.POSITIVE_INFINITY;

    if (aExpiry !== bExpiry) {
        return aExpiry - bExpiry;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function sortHistoricalCredits(a: CreditRecord, b: CreditRecord) {
    const aTime = new Date(a.used_at ?? a.created_at).getTime();
    const bTime = new Date(b.used_at ?? b.created_at).getTime();

    return bTime - aTime;
}

export async function getCreditsPageData(userId: string): Promise<CreditsPageData> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("user_credits")
        .select("id, user_id, amount, source_booking_id, reason, active, created_at, expires_at, used_at")
        .eq("user_id", userId);

    if (error) {
        throwCreditsError("list", error);
    }

    const now = new Date();
    const rawCredits = (data ?? []) as UserCreditRow[];
    const bookingIds = Array.from(
        new Set(
            rawCredits
                .map((credit) => credit.source_booking_id)
                .filter((bookingId): bookingId is string => Boolean(bookingId)),
        ),
    );

    const bookingMap = new Map<string, BookingSummary>();

    if (bookingIds.length > 0) {
        const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("id, booking_reference")
            .eq("user_id", userId)
            .in("id", bookingIds);

        if (bookingsError) {
            throwCreditsError("bookings", bookingsError);
        }

        for (const booking of bookings ?? []) {
            bookingMap.set(booking.id, booking);
        }
    }

    const credits = rawCredits
        .map((credit) => ({
            ...credit,
            source_booking: credit.source_booking_id
                ? bookingMap.get(credit.source_booking_id) ?? null
                : null,
        }))
        .filter((credit) => credit.active);

    const activeCredits = credits
        .filter((credit) => isAvailableCredit(credit, now))
        .sort(sortActiveCredits);

    const historicalCredits = credits
        .filter((credit) => getCreditStatus(credit, now) !== "Available")
        .sort(sortHistoricalCredits);

    return {
        activeCredits,
        historicalCredits,
        totalActiveAmount: activeCredits.reduce(
            (total, credit) => total + Number(credit.amount ?? 0),
            0,
        ),
        activeCount: activeCredits.length,
        historicalCount: historicalCredits.length,
    };
}
