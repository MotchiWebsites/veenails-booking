import {
    confirmAppointmentAction,
    markDepositReceivedAction,
    rejectAppointmentAction,
    reviewCancellationAction,
    updateAppointmentStatusAction,
} from "@/features/admin/appointments/actions/admin-appointments";
import AdminCancellationButton from "@/features/admin/appointments/components/AdminCancellationButton";
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
                Available actions reflect the appointment’s current state.
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
                <div className="mt-5 grid gap-3">
                    {rules.canConfirm ? (
                        <form action={confirmAppointmentAction}>
                            <BookingId id={booking.id} />
                            <button type="submit" className="btn-primary w-full">
                                Confirm appointment
                            </button>
                        </form>
                    ) : null}
                    {rules.canConfirmDeposit ? (
                        <form action={markDepositReceivedAction}>
                            <BookingId id={booking.id} />
                            <button type="submit" className="btn-secondary w-full">
                                Confirm deposit received
                            </button>
                        </form>
                    ) : null}
                    {rules.canComplete ? (
                        <form action={updateAppointmentStatusAction}>
                            <BookingId id={booking.id} />
                            <input type="hidden" name="status" value="completed" />
                            <button type="submit" className="btn-primary w-full">
                                Mark completed
                            </button>
                        </form>
                    ) : null}
                    {rules.canMarkNoShow ? (
                        <details className="rounded-2xl border border-border/60 bg-background p-4">
                            <summary className="cursor-pointer text-sm font-semibold text-foreground">
                                Mark as no-show
                            </summary>
                            <form action={updateAppointmentStatusAction} className="mt-4 space-y-3">
                                <BookingId id={booking.id} />
                                <input type="hidden" name="status" value="no_show" />
                                <ReasonField
                                    label="No-show note"
                                    name="note"
                                    placeholder="Record what happened and any contact attempt…"
                                    required
                                />
                                <button type="submit" className="btn-secondary w-full">
                                    Confirm no-show
                                </button>
                            </form>
                        </details>
                    ) : null}
                </div>
            ) : null}

            {rules.canReject || rules.canCancel ? (
                <details className="mt-5 rounded-2xl border border-border/60 bg-background p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">
                        Decline or cancel
                    </summary>
                    <div className="mt-4 space-y-5">
                        {rules.canReject ? (
                            <form action={rejectAppointmentAction} className="space-y-3">
                                <BookingId id={booking.id} />
                                <ReasonField
                                    label="Rejection reason"
                                    placeholder="Explain why this appointment request is being rejected…"
                                    required
                                />
                                <button type="submit" className="btn-secondary w-full">
                                    Reject appointment
                                </button>
                            </form>
                        ) : null}
                        {rules.canCancel ? <div className="border-t border-border/60 pt-5 first:border-0 first:pt-0"><AdminCancellationButton booking={booking} /></div> : null}
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
