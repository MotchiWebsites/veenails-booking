import AdminDashboardPage from "@/features/admin/dashboard/components/AdminDashboardPage";
import { getAdminDashboardData } from "@/features/admin/dashboard/data/admin-dashboard";

export default async function AdminPage() {
    const data = await getAdminDashboardData();

    return <AdminDashboardPage data={data} />;
}
