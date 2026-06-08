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
};
