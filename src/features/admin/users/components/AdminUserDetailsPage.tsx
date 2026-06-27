"use client";

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
import { updateRegularCustomerAction } from "@/features/admin/users/actions/admin-users";
import AppForm from "@/components/shared/form/AppForm";
import FormCheckbox from "@/components/shared/form/FormCheckbox";

export default function AdminUserDetailsPage({
    user,
}: {
    user: AdminUserDetails;
}) {
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
                        actionHref={`/admin/appointments/new?userId=${encodeURIComponent(user.id)}`}
                        actionLabel="Create appointment"
                    />
                </div>
            </section>
            <section className="grid gap-6 xl:grid-cols-[35%_65%]">
                <div className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                    <h2 className="text-lg font-semibold text-foreground">
                        Contact
                    </h2>
                    <div className="mt-4 space-y-3 text-sm">
                        <p className="text-foreground">
                            Email:{" "}
                            {user.email ?? "External client - no email added"}
                        </p>
                        <p className="text-muted">
                            Phone: {user.phone ?? "No phone"}
                        </p>
                        <p className="text-muted">
                            Instagram:{" "}
                            {user.instagramHandle
                                ? `@${user.instagramHandle}`
                                : "No Instagram"}
                        </p>
                        <AdminStatusPill
                            label={formatContactMethod(
                                user.preferredContactMethod,
                            )}
                        />
                        {user.isRegular ? (
                            <AdminStatusPill
                                label="Regular customer"
                                tone="success"
                                className="mx-2"
                            />
                        ) : null}
                    </div>
                    <AppForm
                        action={updateRegularCustomerAction}
                        className="mx-0 mt-6 w-full max-w-none rounded-2xl border border-border/60 bg-background p-4 md:max-w-none"
                    >
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="isRegular" value="off" />
                        <FormCheckbox
                            id="regular-customer"
                            name="isRegular"
                            defaultChecked={user.isRegular}
                        >
                            <span>
                                <span className="block font-semibold">
                                    Regular customer
                                </span>
                                <span className="text-muted">
                                    Regular customers can access priority
                                    availability before general release.
                                </span>
                                {user.regularSince ? (
                                    <span className="mt-1 block text-xs text-muted">
                                        Since{" "}
                                        {formatDateTime(user.regularSince)}
                                    </span>
                                ) : null}
                            </span>
                        </FormCheckbox>
                        <button
                            type="submit"
                            className="btn-secondary mt-4 w-full"
                        >
                            Save regular status
                        </button>
                    </AppForm>
                    <div className="mt-6 border-t border-border/60 pt-6">
                        <h3 className="font-semibold text-foreground">
                            Issue studio credit
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                            Add a reusable credit directly to this client’s
                            account.
                        </p>
                        <div className="mt-4">
                            <AdminCreditForm userId={user.id} />
                        </div>
                    </div>
                </div>
                <div className="space-y-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                    <h2 className="text-lg font-semibold text-foreground">
                        Appointment history
                    </h2>
                    {user.bookings.length ? (
                        user.bookings.map((booking) => (
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
                                        label={getBookingStatusLabel(
                                            booking.status,
                                        )}
                                    />
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="rounded-2xl bg-background flex items-center justify-center h-3/4 p-4 text-sm text-muted">
                            <p className="text-xl xl:text-2xl 2xl:text-3xl text-center ">
                                No appointment history yet.
                            </p>
                        </div>
                    )}
                </div>
            </section>
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <h2 className="text-lg font-semibold text-foreground">
                    Credit history
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {user.credits.length ? (
                        user.credits.map((credit) => (
                            <div
                                key={credit.id}
                                className="rounded-2xl bg-background p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-lg font-semibold text-foreground">
                                        {formatMoney(credit.amount)}
                                    </p>
                                    <AdminStatusPill
                                        label={
                                            credit.active ? "Available" : "Used"
                                        }
                                    />
                                </div>
                                <p className="mt-2 text-sm text-muted">
                                    {credit.reason ?? "Admin-issued credit"}
                                </p>
                                <p className="mt-2 text-xs text-muted">
                                    Issued {formatDateTime(credit.createdAt)}
                                    {credit.expiresAt
                                        ? ` · expires ${formatDateTime(credit.expiresAt)}`
                                        : ""}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted">
                            No credits issued yet.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
