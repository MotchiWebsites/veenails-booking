import {
    reviewCancellationAction,
} from "@/features/admin/appointments/actions/admin-appointments";
import AdminCancellationButton from "@/features/admin/appointments/components/AdminCancellationButton";
import AdminBookingWorkflowButton from "@/features/admin/appointments/components/AdminBookingWorkflowButton";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { getAdminAppointmentActionRules } from "@/features/admin/appointments/utils/admin-appointment-actions";

function BookingId({ id }: { id: string }) {
    return <input type="hidden" name="bookingId" value={id} />;
}

function ReasonField({
    label,
    name = "reason",
    placeholder,
    required = false,
}: {
    label: string;
    name?: string;
    placeholder: string;
    required?: boolean;
}) {
    return (
        <label className="block space-y-2">
            <span className="label-text">{label}</span>
            <textarea
                name={name}
                required={required}
                rows={3}
                className="input-field min-h-24 resize-y leading-relaxed"
                placeholder={placeholder}
            />
        </label>
    );
}

export default function AdminAppointmentActions({
    booking,
}: {
    booking: AdminAppointmentDetails;
}) {
    const rules = getAdminAppointmentActionRules(booking);
    const request = booking.cancellationRequest;
    const hasOperationalActions =
        rules.canConfirm ||
        rules.canConfirmDeposit ||
        rules.canComplete ||
        rules.canMarkNoShow;

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Actions</h2>
            <p className="mt-1 text-sm text-muted">
                Available actions reflect the appointment&apos;s current state.
            </p>

            {rules.canReviewCancellation && request ? (
                <div className="mt-5 space-y-4 rounded-2xl border border-border/60 bg-surface-2 p-4">
                    <div>
                        <h3 className="font-semibold text-foreground">
                            Cancellation review
                        </h3>
                        <p className="mt-1 text-sm text-muted">{request.reason}</p>
                    </div>
                    <AdminCancellationButton booking={booking} label="Approve and process cancellation" className="btn-primary w-full" />
                    <form action={reviewCancellationAction} className="space-y-3">
                        <BookingId id={booking.id} />
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <ReasonField
                            label="Rejection reason"
                            placeholder="Explain why the cancellation request was declined…"
                            required
                        />
                        <button type="submit" className="btn-secondary w-full">
                            Reject cancellation
                        </button>
                    </form>
                </div>
            ) : null}

            {hasOperationalActions ? (
                <div className="mt-5 max-w-xl mx-auto">
                    <AdminBookingWorkflowButton booking={booking} />
                </div>
            ) : null}

            {rules.canCancel ? (
                <details className="mt-5 rounded-2xl border border-border/60 bg-background p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">
                        Cancel appointment
                    </summary>
                    <div className="mt-4">
                        <AdminCancellationButton booking={booking} />
                    </div>
                </details>
            ) : null}

            {rules.terminal ? (
                <p className="mt-5 rounded-2xl bg-background p-4 text-sm text-muted">
                    This appointment is closed. Normal operational actions are hidden; its details and services remain available for admin correction.
                </p>
            ) : null}
        </section>
    );
}
