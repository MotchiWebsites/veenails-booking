import Link from "next/link";
import { FiCheckCircle, FiClock, FiCreditCard } from "react-icons/fi";

import StatusCard from "@/features/dashboard/components/StatusCard";
import QuickActions from "@/features/dashboard/components/QuickActions";
import DashboardAvailabilityCalendar from "@/features/dashboard/components/availability-calendar/DashboardAvailabilityCalendar";
import DashboardUpcomingAppointments from "@/features/dashboard/components/upcoming-appointments/DashboardUpcomingAppointments";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import AnimatedArrowLink from "@/components/shared/ui/AnimatedArrowLink";
import type { DashboardOverviewData } from "@/features/dashboard/types/dashboard";
import DealsAnnouncementBanner from "@/features/deals/components/DealsAnnouncementBanner";
import type { DealView } from "@/features/deals/data/deals";

export default function DashboardOverview({
    data,
    deals,
}: {
    data: DashboardOverviewData;
    deals: DealView[];
}) {
    const { profile, stats } = data;

    return (
        <div className="space-y-8">
            <DealsAnnouncementBanner
                deals={deals}
                primaryHref="/book"
                primaryLabel="Use This Deal"
                secondaryHref="/credits"
                secondaryLabel="View Credits"
                className="overflow-hidden rounded-3xl border border-border/60 bg-transparent shadow-sm"
            />

            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7 lg:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                        <SectionIntro
                            eyebrow="Client dashboard"
                            title={`${profile.displayName}'s Dashboard`}
                            description="Request new bookings, track confirmations, review policies, and keep your contact details updated for appointment reminders."
                            align="left"
                        />

                        <div className="mt-6 flex flex-col gap-3 xl:flex-row">
                            <AnimatedArrowLink
                                href="/book"
                                className="btn-primary w-full xl:w-auto"
                            >
                                Start Booking
                            </AnimatedArrowLink>

                            <Link href="/profile" className="btn-secondary w-full sm:w-auto">
                                Update Profile
                            </Link>

                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <StatusCard
                            icon={<FiClock className="h-5 w-5" />}
                            label="Pending requests"
                            value={String(stats.pendingRequests)}
                        />

                        <StatusCard
                            icon={<FiCheckCircle className="h-5 w-5" />}
                            label="Confirmed bookings"
                            value={String(stats.confirmedBookings)}
                        />

                        <StatusCard
                            icon={<FiCreditCard className="h-5 w-5" />}
                            label="Available credits"
                            value={`$${stats.availableCredits.toFixed(2)}`}
                        />
                    </div>
                </div>
            </section>

            <DashboardUpcomingAppointments
                bookings={data.upcomingAppointments}
            />

            <DashboardAvailabilityCalendar days={data.availability.days} />

            <QuickActions />
        </div>
    );
}
