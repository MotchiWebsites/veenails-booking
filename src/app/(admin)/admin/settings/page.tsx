import AdminSettingsPage from "@/features/admin/settings/components/AdminSettingsPage";
import { getAdminBookingSettings } from "@/features/admin/settings/data/admin-settings";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Admin Settings",
    description: "Manage booking settings.",
    path: "/admin/settings",
    noIndex: true,
});

export default async function AdminSettingsRoute() {
    const settings = await getAdminBookingSettings();

    return <AdminSettingsPage settings={settings} />;
}
