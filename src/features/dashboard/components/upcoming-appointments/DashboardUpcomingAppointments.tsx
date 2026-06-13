import Link from "next/link";
import { FiCalendar, FiPlus } from "react-icons/fi";

import type { BookingSummary } from "@/features/bookings/types/bookings";

import DashboardAppointmentCard from "./DashboardAppointmentCard";

export default function DashboardUpcomingAppointments({
    bookings,
}: {
    bookings: BookingSummary[];
}) {
    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-dark-green">
                        Upcoming appointments
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                        Your next visits
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        A quick look at active requests and confirmed
                        appointments.
                    </p>
                </div>

                <Link href="/booking" className="btn-secondary">
                    View all bookings
                </Link>
            </div>

            {bookings.length > 0 ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    {bookings.map((booking) => (
                        <DashboardAppointmentCard
                            key={booking.id}
                            booking={booking}
                        />
                    ))}
                </div>
            ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-border/60 bg-background p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-main/10 text-pink-main">
                                <FiCalendar
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-foreground">
                                    No upcoming appointments
                                </h3>
                                <p className="mt-1 text-sm leading-relaxed text-muted">
                                    When you request or confirm a booking, it
                                    will appear here.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/book"
                            className="btn-primary inline-flex items-center justify-center gap-2 sm:shrink-0"
                        >
                            <FiPlus className="h-4 w-4" aria-hidden="true" />
                            Book appointment
                        </Link>
                    </div>
                </div>
            )}
        </section>
    );
}
