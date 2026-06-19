import { requireUser } from "@/features/auth/guards/require-user";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { buildMetadata } from "@/lib/seo/metadata";
import { isAdminUser } from "@/features/admin/auth/admin-auth";

export const metadata = buildMetadata({
    title: "Dashboard",
    description: "Your booking dashboard (private)",
    path: "/dashboard",
    noIndex: true,
});

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireUser();
    const isAdmin = await isAdminUser(user.id);

    return (
        <DashboardShell user={user} isAdmin={isAdmin}>
            {children}
        </DashboardShell>
    );
}
