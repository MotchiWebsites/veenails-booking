import { requireAdmin } from "@/features/auth/guards/require-admin";
import AdminShell from "@/features/admin/components/AdminShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Admin Dashboard",
    description: "Administrative area (private).",
    path: "/admin",
    noIndex: true,
});

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdmin();

    return <AdminShell>{children}</AdminShell>;
}
