import AdminUserDetailsPage from "@/features/admin/users/components/AdminUserDetailsPage";
import { getAdminUserDetails } from "@/features/admin/users/data/admin-users";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Admin User Details",
    description: "View client appointment history.",
    path: "/admin/users",
    noIndex: true,
});

export default async function AdminUserDetailsRoute({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    const { userId } = await params;
    const user = await getAdminUserDetails(userId);

    return <AdminUserDetailsPage user={user} />;
}
