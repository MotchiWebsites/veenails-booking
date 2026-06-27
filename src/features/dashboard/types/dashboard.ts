import type { BookingSummary } from "@/features/bookings/types/bookings";
import type { Enums } from "@/types/supabase";

export type DashboardStats = {
    pendingRequests: number;
    confirmedBookings: number;
    availableCredits: number;
};

export type DashboardProfile = {
    displayName: string;
    email: string;
    phone: string | null;
    instagramHandle: string | null;
    preferredContactMethod: Enums<"preferred_contact_method">;
};

export type DashboardOverviewData = {
    profile: DashboardProfile;
    stats: DashboardStats;
    availability: {
        days: {
            date: string;
            label: string;
            dayName: string;
            dayNumber: string;
            monthLabel: string;
            isToday: boolean;
            slots: {
                id: string;
                startsAt: string;
                endsAt: string | null;
                available: boolean;
            }[];
        }[];
    };
    upcomingAppointments: BookingSummary[];
};
