import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Enums } from "@/types/supabase";

type ProfileRow = Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    | "id"
    | "display_name"
    | "email"
    | "phone"
    | "instagram_handle"
    | "preferred_contact_method"
    | "created_at"
>;

type BookingRow = Pick<
    Database["public"]["Tables"]["bookings"]["Row"],
    "id" | "booking_reference" | "status" | "created_at"
> & {
    availability_slots:
        | Pick<
              Database["public"]["Tables"]["availability_slots"]["Row"],
              "starts_at" | "ends_at"
          >
        | null;
};

export type AdminUserListItem = {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    instagramHandle: string | null;
    preferredContactMethod: Enums<"preferred_contact_method">;
    createdAt: string;
    bookingCount: number;
    upcomingBookingCount: number;
    lastBookingAt: string | null;
};

export type AdminUserDetails = AdminUserListItem & {
    bookings: Array<{
        id: string;
        bookingReference: string;
        status: Enums<"booking_status">;
        startsAt: string | null;
        endsAt: string | null;
        createdAt: string;
    }>;
    credits: Array<{ id: string; amount: number; reason: string | null; active: boolean; expiresAt: string | null; createdAt: string }>;
};

async function getBookingStats(userIds: string[]) {
    if (userIds.length === 0) return new Map<string, BookingRow[]>();

    const admin = createAdminClient();
    const { data, error } = await admin
        .from("bookings")
        .select(
            "id, booking_reference, status, created_at, user_id, availability_slots:slot_id(starts_at, ends_at)",
        )
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
        .overrideTypes<Array<BookingRow & { user_id: string }>>();

    if (error) {
        console.error("[admin:users:booking-stats]", error);
        throw new Error("We couldn't load user booking stats.");
    }

    const byUser = new Map<string, BookingRow[]>();

    for (const booking of data ?? []) {
        byUser.set(booking.user_id, [
            ...(byUser.get(booking.user_id) ?? []),
            booking,
        ]);
    }

    return byUser;
}

function mapUser(row: ProfileRow, bookings: BookingRow[]): AdminUserListItem {
    const now = Date.now();

    return {
        id: row.id,
        displayName: row.display_name,
        email: row.email,
        phone: row.phone,
        instagramHandle: row.instagram_handle,
        preferredContactMethod: row.preferred_contact_method,
        createdAt: row.created_at,
        bookingCount: bookings.length,
        upcomingBookingCount: bookings.filter(
            (booking) =>
                ["held", "requested", "confirmed", "cancellation_requested"].includes(booking.status) &&
                booking.availability_slots?.starts_at &&
                new Date(booking.availability_slots.starts_at).getTime() >= now,
        ).length,
        lastBookingAt:
            bookings[0]?.availability_slots?.starts_at ??
            bookings[0]?.created_at ??
            null,
    };
}

export async function getAdminUsers(search = "") {
    await requireAdmin();
    const admin = createAdminClient();

    const { data, error } = await admin
        .from("profiles")
        .select(
            "id, display_name, email, phone, instagram_handle, preferred_contact_method, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100)
        .overrideTypes<ProfileRow[]>();

    if (error) {
        console.error("[admin:users:list]", error);
        throw new Error("We couldn't load users.");
    }

    const bookingsByUser = await getBookingStats((data ?? []).map((row) => row.id));
    const users = (data ?? []).map((row) =>
        mapUser(row, bookingsByUser.get(row.id) ?? []),
    );
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return users;

    return users.filter((user) =>
        [
            user.displayName,
            user.email,
            user.phone,
            user.instagramHandle,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch),
    );
}

export async function getAdminUserDetails(userId: string) {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: profile, error } = await admin
        .from("profiles")
        .select(
            "id, display_name, email, phone, instagram_handle, preferred_contact_method, created_at",
        )
        .eq("id", userId)
        .maybeSingle()
        .overrideTypes<ProfileRow | null>();

    if (error) {
        console.error("[admin:users:details]", error);
        throw new Error("We couldn't load this user.");
    }

    if (!profile) notFound();

    const bookingsByUser = await getBookingStats([userId]);
    const bookings = bookingsByUser.get(userId) ?? [];
    const { data: credits, error: creditsError } = await admin.from("user_credits").select("id, amount, reason, active, expires_at, created_at").eq("user_id", userId).order("created_at", { ascending: false }).overrideTypes<Array<{ id: string; amount: number; reason: string | null; active: boolean; expires_at: string | null; created_at: string }>>();
    if (creditsError) {
        console.error("[admin:users:credits]", creditsError);
        throw new Error("We couldn't load this user's credits.");
    }

    return {
        ...mapUser(profile, bookings),
        bookings: bookings.map((booking) => ({
            id: booking.id,
            bookingReference: booking.booking_reference,
            status: booking.status,
            startsAt: booking.availability_slots?.starts_at ?? null,
            endsAt: booking.availability_slots?.ends_at ?? null,
            createdAt: booking.created_at,
        })),
        credits: (credits ?? []).map((credit) => ({ id: credit.id, amount: Number(credit.amount), reason: credit.reason, active: credit.active, expiresAt: credit.expires_at, createdAt: credit.created_at })),
    };
}
