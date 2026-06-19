import AdminUsersPage from "@/features/admin/users/components/AdminUsersPage";
import { getAdminUsers } from "@/features/admin/users/data/admin-users";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Admin Users",
    description: "Manage client profiles.",
    path: "/admin/users",
    noIndex: true,
});

function getParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminUsersRoute({
    searchParams,
}: {
    searchParams: Promise<{ q?: string | string[] }>;
}) {
    const params = await searchParams;
    const search = getParam(params.q);
    const users = await getAdminUsers(search);

    return <AdminUsersPage users={users} search={search} />;
}
