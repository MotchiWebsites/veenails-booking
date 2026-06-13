import type { BookingSummary } from "@/features/bookings/types/bookings";

export type DashboardStats = {
    pendingRequests: number;
    confirmedBookings: number;
    availableCredits: number;
};

export type DashboardProfile = {
    displayName: string;
    email: string;
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
                endsAt: string;
                available: boolean;
            }[];
        }[];
    };
    upcomingAppointments: BookingSummary[];
};
