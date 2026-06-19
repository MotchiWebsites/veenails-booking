"use client";

import { useState } from "react";
import AdminCancellationModal from "@/features/admin/appointments/components/AdminCancellationModal";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";

export default function AdminCancellationButton({ booking, label = "Cancel appointment", className = "btn-secondary w-full" }: { booking: AdminAppointmentDetails; label?: string; className?: string }) {
    const [open, setOpen] = useState(false);
    return <><button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>{open ? <AdminCancellationModal booking={booking} onClose={() => setOpen(false)} /> : null}</>;
}
