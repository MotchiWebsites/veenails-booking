import Link from "next/link";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import AdminEmptyState from "@/features/admin/components/AdminEmptyState";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import { formatContactMethod, formatDateTime } from "@/features/admin/components/admin-formatters";
import type { AdminUserListItem } from "@/features/admin/users/data/admin-users";

export default function AdminUsersPage({
    users,
    search,
}: {
    users: AdminUserListItem[];
    search: string;
}) {
    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                <AdminPageHeader
                    eyebrow="Admin"
                    title="Users"
                    description="Search client profiles and open appointment history."
                />
                <form className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <input
                        name="q"
                        defaultValue={search}
                        placeholder="Search name, email, phone, Instagram"
                        className="input-field"
                    />
                    <button type="submit" className="btn-secondary">
                        Search
                    </button>
                </form>
            </section>
            <section className="space-y-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7">
                {users.length > 0 ? (
                    users.map((user) => (
                        <article
                            key={user.id}
                            className="group rounded-2xl border border-border/60 bg-background p-4 transition hover:border-dark-green/30 hover:shadow-sm"
                        >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="font-semibold text-foreground">
                                        {user.displayName}
                                    </p>
                                    <p className="mt-1 text-sm text-muted">
                                        {user.email}
                                    </p>
                                    <p className="mt-1 text-sm text-muted">
                                        {formatContactMethod(
                                            user.preferredContactMethod,
                                        )}{" "}
                                        · {user.phone ?? "No phone"} ·{" "}
                                        {user.instagramHandle
                                            ? `@${user.instagramHandle}`
                                            : "No Instagram"}
                                    </p>
                                </div>
                                <div className="text-sm text-muted lg:text-right">
                                    <p>{user.bookingCount} bookings</p>
                                    <p>{user.upcomingBookingCount} upcoming</p>
                                    <p>Last {formatDateTime(user.lastBookingAt)}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row">
                                <Link href={`/admin/users/${user.id}`} className="btn-secondary inline-flex items-center justify-center gap-2">View profile <FiArrowRight aria-hidden="true" /></Link>
                                <Link href={`/admin/appointments?q=${encodeURIComponent(user.email)}`} className="btn-secondary inline-flex items-center justify-center gap-2"><FiCalendar aria-hidden="true" /> View appointments</Link>
                                <span className="self-center text-xs text-muted sm:ml-auto">Open user details</span>
                            </div>
                        </article>
                    ))
                ) : (
                    <AdminEmptyState message="No users match that search." />
                )}
            </section>
        </div>
    );
}
