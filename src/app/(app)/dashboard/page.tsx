import { buildMetadata } from "@/lib/seo/metadata";
import { requireUser } from "@/features/auth/guards/require-user";
import DashboardOverview from "@/features/dashboard/components/DashboardOverview";
import { getDashboardOverviewData } from "@/features/dashboard/data/dashboard";

export const metadata = buildMetadata({
    title: "Dashboard",
    description:
        "Manage your nail appointments and booking requests (private).",
    path: "/dashboard",
    noIndex: true,
});

export default async function DashboardPage() {
    const user = await requireUser();
    const data = await getDashboardOverviewData(user.id);

    return <DashboardOverview data={data} />;
}
