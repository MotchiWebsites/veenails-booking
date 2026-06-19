import AdminAppointmentDetailsPage from "@/features/admin/appointments/components/AdminAppointmentDetailsPage";
import { getAdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Admin Appointment Details",
    description: "Manage appointment details.",
    path: "/admin/appointments",
    noIndex: true,
});

export default async function AdminAppointmentDetailsRoute({
    params,
}: {
    params: Promise<{ bookingId: string }>;
}) {
    const { bookingId } = await params;
    const booking = await getAdminAppointmentDetails(bookingId);

    return <AdminAppointmentDetailsPage booking={booking} />;
}
