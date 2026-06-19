import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import AdminStatusPill from "@/features/admin/components/AdminStatusPill";
import {
    formatBookingDateTime,
    formatContactMethod,
    formatDateTime,
} from "@/features/admin/components/admin-formatters";
import type { AdminUserDetails } from "@/features/admin/users/data/admin-users";
import { getBookingStatusLabel } from "@/features/bookings/utils/booking-status";
import AdminCreditForm from "@/features/admin/credits/components/AdminCreditForm";
import { formatMoney } from "@/features/admin/components/admin-formatters";

export default function AdminUserDetailsPage({ user }: { user: AdminUserDetails }) {
    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-dark-green transition hover:text-pink-main"
                >
                    <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to users
                </Link>
                <div className="mt-5">
                    <AdminPageHeader
                        eyebrow="Client"
                        title={user.displayName}
                        description={`${user.bookingCount} bookings · joined ${formatDateTime(user.createdAt)}`}
                    />
                </div>
            </section>
            <section className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
                <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                    <h2 className="text-lg font-semibold text-foreground">
                        Contact
                    </h2>
                    <div className="mt-4 space-y-3 text-sm">
                        <p className="text-foreground">{user.email}</p>
                        <p className="text-muted">{user.phone ?? "No phone"}</p>
                        <p className="text-muted">
                            {user.instagramHandle
                                ? `@${user.instagramHandle}`
                                : "No Instagram"}
                        </p>
                        <AdminStatusPill
                            label={formatContactMethod(user.preferredContactMethod)}
                        />
                    </div>
                    <div className="mt-6 border-t border-border/60 pt-6">
                        <h3 className="font-semibold text-foreground">Issue studio credit</h3>
                        <p className="mt-1 text-sm text-muted">Add a reusable credit directly to this client’s account.</p>
                        <div className="mt-4"><AdminCreditForm userId={user.id} /></div>
                    </div>
                </div>
                <div className="space-y-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                    <h2 className="text-lg font-semibold text-foreground">
                        Appointment history
                    </h2>
                    {user.bookings.map((booking) => (
                        <Link
                            key={booking.id}
                            href={`/admin/appointments/${booking.id}`}
                            className="block rounded-2xl bg-background p-4 transition hover:bg-surface-2"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-semibold text-dark-green">
                                        #{booking.bookingReference}
                                    </p>
                                    <p className="mt-1 text-sm text-muted">
                                        {formatBookingDateTime(
                                            booking.startsAt,
                                            booking.endsAt,
                                        )}
                                    </p>
                                </div>
                                <AdminStatusPill
                                    label={getBookingStatusLabel(booking.status)}
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <h2 className="text-lg font-semibold text-foreground">Credit history</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {user.credits.length ? user.credits.map((credit) => <div key={credit.id} className="rounded-2xl bg-background p-4"><div className="flex items-center justify-between gap-3"><p className="text-lg font-semibold text-foreground">{formatMoney(credit.amount)}</p><AdminStatusPill label={credit.active ? "Available" : "Used"} /></div><p className="mt-2 text-sm text-muted">{credit.reason ?? "Admin-issued credit"}</p><p className="mt-2 text-xs text-muted">Issued {formatDateTime(credit.createdAt)}{credit.expiresAt ? ` · expires ${formatDateTime(credit.expiresAt)}` : ""}</p></div>) : <p className="text-sm text-muted">No credits issued yet.</p>}
                </div>
            </section>
        </div>
    );
}
