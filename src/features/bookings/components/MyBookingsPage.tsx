import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import UpcomingBookingsSection from "@/features/bookings/components/UpcomingBookingsSection";
import PastBookingsSection from "@/features/bookings/components/PastBookingsSection";
import type { MyBookingsPageData } from "@/features/bookings/types/bookings";

export default function MyBookingsPage({ data }: { data: MyBookingsPageData }) {
    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7 lg:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <SectionIntro
                        eyebrow="Appointments"
                        title="My bookings"
                        description="View upcoming appointments, track booking requests, and review your booking history."
                        align="left"
                    />

                    <Link
                        href="/booking/new"
                        className="btn-primary inline-flex items-center justify-center gap-2 lg:shrink-0"
                    >
                        <FiPlus className="h-4 w-4" aria-hidden="true" />
                        Book New Appointment
                    </Link>
                </div>
            </section>

            <UpcomingBookingsSection bookings={data.upcomingBookings} />

            <PastBookingsSection
                bookings={data.pastBookings}
                pagination={data.pagination}
                filters={data.filters}
            />
        </div>
    );
}
