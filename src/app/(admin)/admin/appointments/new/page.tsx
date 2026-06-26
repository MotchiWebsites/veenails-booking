import AdminCreateAppointmentPage from "@/features/admin/appointments/components/AdminCreateAppointmentPage";
import { getAdminCreateAppointmentData } from "@/features/admin/appointments/data/admin-create-appointment";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Create Appointment",
    description: "Create a Vee's Nail Studio appointment for a customer.",
    path: "/admin/appointments/new",
    noIndex: true,
});

function getParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminCreateAppointmentRoute({
    searchParams,
}: {
    searchParams: Promise<{ userId?: string | string[] }>;
}) {
    const params = await searchParams;
    const data = await getAdminCreateAppointmentData();

    return (
        <AdminCreateAppointmentPage
            {...data}
            initialUserId={getParam(params.userId)}
        />
    );
}
