import { buildMetadata } from "@/lib/seo/metadata";
import { requireUser } from "@/features/auth/guards/require-user";
import MyBookingsPage from "@/features/bookings/components/MyBookingsPage";
import { getMyBookingsPageData } from "@/features/bookings/data/bookings";
import { bookingStatusFilterValues } from "@/features/bookings/utils/booking-status";
import type { BookingStatusFilter } from "@/features/bookings/types/bookings";

export const metadata = buildMetadata({
    title: "My Bookings",
    description:
        "View and manage your Vee's Nail Studio booking requests and appointments.",
    path: "/booking",
    noIndex: true,
});

function getStringParam(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
        return value[0] ?? "";
    }

    return value ?? "";
}

function parsePage(value: string | string[] | undefined) {
    const page = Number.parseInt(getStringParam(value), 10);

    return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseStatus(value: string | string[] | undefined): BookingStatusFilter {
    const status = getStringParam(value);

    if (bookingStatusFilterValues.includes(status as BookingStatusFilter)) {
        return status as BookingStatusFilter;
    }

    return "all";
}

export default async function BookingPage({
    searchParams,
}: {
    searchParams: Promise<{
        q?: string | string[];
        status?: string | string[];
        page?: string | string[];
    }>;
}) {
    const user = await requireUser();
    const params = await searchParams;

    const data = await getMyBookingsPageData({
        userId: user.id,
        search: getStringParam(params.q),
        status: parseStatus(params.status),
        page: parsePage(params.page),
        pageSize: 6,
    });

    return <MyBookingsPage data={data} />;
}
