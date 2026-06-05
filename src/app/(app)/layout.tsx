import { requireUser } from "@/features/auth/guards/require-user";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { buildMetadata } from "@/lib/seo/metadata";

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

    return <DashboardShell user={user}>{children}</DashboardShell>;
}
