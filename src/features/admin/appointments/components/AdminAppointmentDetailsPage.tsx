import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import {
    markInspoReviewedAction,
} from "@/features/admin/appointments/actions/admin-appointments";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import AdminStatusPill from "@/features/admin/components/AdminStatusPill";
import {
    formatBookingDateTime,
    formatContactMethod,
    formatDateTime,
    formatMoney,
} from "@/features/admin/components/admin-formatters";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import {
    getBookingStatusLabel,
    getDepositStatusLabel,
} from "@/features/bookings/utils/booking-status";
import AdminAppointmentEditor from "@/features/admin/appointments/components/AdminAppointmentEditor";
import AdminAppointmentActions from "@/features/admin/appointments/components/AdminAppointmentActions";
import AdminDiscountEditor from "@/features/admin/appointments/components/AdminDiscountEditor";
import AdminCancellationSummary from "@/features/admin/appointments/components/AdminCancellationSummary";
import AdminCreditForm from "@/features/admin/credits/components/AdminCreditForm";

function ActionButton({
    children,
    variant = "secondary",
}: {
    children: React.ReactNode;
    variant?: "primary" | "secondary";
}) {
    return (
        <button
            type="submit"
            className={variant === "primary" ? "btn-primary" : "btn-secondary"}
        >
            {children}
        </button>
    );
}

function HiddenBookingId({ id }: { id: string }) {
    return <input type="hidden" name="bookingId" value={id} />;
}

export default function AdminAppointmentDetailsPage({
    booking,
}: {
    booking: AdminAppointmentDetails;
}) {
    const client = booking.profile;
    const externalClient = booking.externalClient;
    const displayClient = client
        ? {
              displayName: client.displayName,
              email: client.email,
              phone: client.phone,
              instagramHandle: client.instagramHandle,
              preferredContactMethod: client.preferredContactMethod,
              label: "App customer",
          }
        : {
              displayName: externalClient.displayName,
              email: externalClient.email,
              phone: null,
              instagramHandle: externalClient.instagramHandle,
              preferredContactMethod: externalClient.preferredContactMethod,
              label: "External client",
          };

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <Link
                    href="/admin/appointments"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-dark-green transition hover:text-pink-main"
                >
                    <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to appointments
                </Link>
                <div className="mt-5">
                    <AdminPageHeader
                        eyebrow="Appointment"
                        title={`#${booking.bookingReference}`}
                        description={formatBookingDateTime(
                            booking.startsAt,
                            booking.endsAt,
                        )}
                    />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <AdminStatusPill label={getBookingStatusLabel(booking.status)} />
                    <AdminStatusPill
                        label={getDepositStatusLabel(booking.depositStatus)}
                    />
                    {booking.inspoPrompt ? (
                        <AdminStatusPill
                            label={`Inspo ${booking.inspoPrompt.status}`}
                        />
                    ) : null}
                </div>
            </section>

            <AdminCancellationSummary booking={booking} />

            <AdminAppointmentEditor booking={booking} />

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="space-y-6">
                    <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                        <h2 className="text-lg font-semibold text-foreground">
                            Client
                        </h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Summary label="Type" value={displayClient.label} />
                            <Summary label="Name" value={displayClient.displayName} />
                            <Summary label="Email" value={displayClient.email} />
                            <Summary label="Phone" value={displayClient.phone} />
                            <Summary
                                label="Instagram"
                                value={
                                    displayClient.instagramHandle
                                        ? `@${displayClient.instagramHandle}`
                                        : null
                                }
                            />
                            <Summary
                                label="Preferred contact"
                                value={formatContactMethod(
                                    displayClient.preferredContactMethod,
                                )}
                            />
                        </div>
                        {client ? (
                            <Link href={`/admin/users/${client.id}`} className="btn-secondary mt-4 inline-flex">
                                View customer
                            </Link>
                        ) : null}
                    </div>

                    <DesignInspo booking={booking} />
                    <CancellationPanel booking={booking} />
                    <HistoryLog booking={booking} />
                </div>

                <div className="space-y-4">
                    <AdminDiscountEditor booking={booking} />
                    <AdminAppointmentActions booking={booking} />
                    <PaymentsPanel booking={booking} />
                    {client ? <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm"><h2 className="text-lg font-semibold text-foreground">Issue credit</h2><p className="mt-1 text-sm text-muted">Link a manual credit to this appointment.</p><div className="mt-4"><AdminCreditForm userId={client.id} bookingId={booking.id} /></div></div> : null}
                </div>
            </section>
        </div>
    );
}

function Summary({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="rounded-2xl bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {label}
            </p>
            <p className="mt-2 wrap-break-word text-sm font-semibold text-foreground">
                {value || "Not provided"}
            </p>
        </div>
    );
}

function PaymentsPanel({ booking }: { booking: AdminAppointmentDetails }) {
    return (
        <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Payments</h2>
            <div className="mt-4 space-y-3">
                {booking.payments.length > 0 ? (
                    booking.payments.map((payment) => (
                        <div key={payment.id} className="rounded-2xl bg-background p-4">
                            <p className="text-sm font-semibold text-foreground">
                                {formatMoney(payment.amount)}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                {payment.paymentType} · {payment.method} · {payment.status}
                            </p>
                            {payment.paidAt ? (
                                <p className="mt-1 text-xs text-muted">
                                    Paid {formatDateTime(payment.paidAt)}
                                </p>
                            ) : null}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted">No payments yet.</p>
                )}
            </div>
        </div>
    );
}

function CancellationPanel({ booking }: { booking: AdminAppointmentDetails }) {
    const request = booking.cancellationRequest;

    if (!request) return null;

    return (
        <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-foreground">
                Cancellation request
            </h2>
            <p className="mt-2 text-sm text-muted">{request.reason}</p>
            <p className="mt-1 text-sm text-muted">Status: {request.status}</p>
            {request.adminReason ? <p className="mt-2 text-sm text-muted">Admin note: {request.adminReason}</p> : null}
        </div>
    );
}

function DesignInspo({ booking }: { booking: AdminAppointmentDetails }) {
    const inspo = booking.inspoPrompt;

    return (
        <div id="design-inspo" className="scroll-mt-24 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-foreground">Design inspo</h2>
            {inspo ? (
                <div className="mt-4 space-y-3">
                    <AdminStatusPill label={inspo.status} />
                    <pre className="whitespace-pre-wrap rounded-2xl bg-background p-4 text-sm text-foreground">
                        {inspo.messageText}
                    </pre>
                    {inspo.instagramUrl ? (
                        <Link
                            href={inspo.instagramUrl}
                            target="_blank"
                            className="btn-secondary"
                        >
                            Open Instagram
                        </Link>
                    ) : null}
                    <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
                        <p>Copied: {formatDateTime(inspo.copiedAt)}</p>
                        <p>Opened: {formatDateTime(inspo.openedAt)}</p>
                        <p>Sent: {formatDateTime(inspo.inspoSentAt)}</p>
                        <p>Reviewed: {formatDateTime(inspo.reviewedAt)}</p>
                    </div>
                    {inspo.status === "sent" ? (
                        <form action={markInspoReviewedAction}>
                            <HiddenBookingId id={booking.id} />
                            <input type="hidden" name="promptId" value={inspo.id} />
                            <ActionButton variant="primary">
                                Mark inspo reviewed
                            </ActionButton>
                        </form>
                    ) : null}
                </div>
            ) : (
                <p className="mt-3 text-sm text-muted">No inspo prompt yet.</p>
            )}
        </div>
    );
}

function HistoryLog({ booking }: { booking: AdminAppointmentDetails }) {
    return (
        <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-foreground">
                Appointment Event Log
            </h2>
            <div className="mt-4 space-y-3">
                {booking.events.length > 0 ? (
                    booking.events.map((event) => (
                        <div key={event.id} className="rounded-2xl bg-background p-4">
                            <p className="text-sm uppercase font-semibold text-foreground">
                                {event.eventType.replaceAll("_", " ")}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                                {formatDateTime(event.createdAt)} · {event.actorType}
                            </p>
                            {event.message ? (
                                <p className="mt-2 text-sm text-muted">
                                    {event.message}
                                </p>
                            ) : null}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted">No history yet.</p>
                )}
            </div>
        </div>
    );
}
