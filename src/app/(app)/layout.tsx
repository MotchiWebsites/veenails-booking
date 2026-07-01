import { requireUser } from "@/features/auth/guards/require-user";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { buildMetadata } from "@/lib/seo/metadata";
import { isAdminUser } from "@/features/admin/auth/admin-auth";
import { requireCompleteProfile } from "@/features/auth/guards/require-complete-profile";

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
    const profile = await requireCompleteProfile(user.id);
    const isAdmin = await isAdminUser(user.id);

    return (
        <DashboardShell
            user={user}
            displayName={profile.display_name}
            isAdmin={isAdmin}
        >
            {children}
        </DashboardShell>
    );
}
