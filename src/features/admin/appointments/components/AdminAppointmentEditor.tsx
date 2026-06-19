import { updateAppointmentSlotAction } from "@/features/admin/appointments/actions/admin-appointments";
import AdminServiceEditor from "@/features/admin/appointments/components/AdminServiceEditor";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { formatBookingDateTime } from "@/features/admin/components/admin-formatters";

export default function AdminAppointmentEditor({
    booking,
}: {
    booking: AdminAppointmentDetails;
}) {
    return (
        <div className="space-y-6">
            <AdminServiceEditor booking={booking} />

            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Appointment time
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Current: {formatBookingDateTime(booking.startsAt, booking.endsAt)}
                    </p>
                </div>
                <form
                    action={updateAppointmentSlotAction}
                    className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-end"
                >
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <label className="block flex-1 space-y-2">
                        <span className="label-text">Move to an open slot</span>
                        <select name="slotId" className="input-field" required defaultValue="">
                            <option value="" disabled>Select date and time</option>
                            {booking.editorSlots.map((slot) => (
                                <option key={slot.id} value={slot.id}>
                                    {formatBookingDateTime(slot.startsAt, slot.endsAt)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="submit" className="btn-secondary xl:shrink-0">
                        Update time
                    </button>
                </form>
            </section>
        </div>
    );
}
