import AdminAppointmentsPage from "@/features/admin/appointments/components/AdminAppointmentsPage";
import { getAdminAppointments } from "@/features/admin/appointments/data/admin-appointments";
import { buildMetadata } from "@/lib/seo/metadata";
import { isAdminAppointmentView } from "@/features/admin/appointments/utils/admin-appointment-views";

export const metadata = buildMetadata({
    title: "Admin Appointments",
    description: "Manage Vee's Nail Studio appointments.",
    path: "/admin/appointments",
    noIndex: true,
});

function getParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminAppointmentsRoute({
    searchParams,
}: {
    searchParams: Promise<{ q?: string | string[]; status?: string | string[]; view?: string | string[] }>;
}) {
    const params = await searchParams;
    const search = getParam(params.q);
    const status = getParam(params.status) || "all";
    const viewParam = getParam(params.view);
    const view = isAdminAppointmentView(viewParam) ? viewParam : null;
    const appointments = await getAdminAppointments({ search, status });

    return (
        <AdminAppointmentsPage
            appointments={appointments}
            search={search}
            status={status}
            view={view}
            nowIso={new Date().toISOString()}
        />
    );
}
