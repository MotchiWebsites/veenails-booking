import Link from "next/link";
import {
    FiArrowRight,
    FiCheckCircle,
    FiClock,
    FiCreditCard,
} from "react-icons/fi";

import StatusCard from "@/components/dashboard/StatusCard";
import QuickActions from "@/components/dashboard/QuickActions";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import { buildMetadata } from "@/lib/seo/metadata";

import { requireUser } from "@/features/auth/guards/require-user";

export const metadata = buildMetadata({
    title: "Dashboard",
    description:
        "Manage your nail appointments and booking requests (private).",
    path: "/dashboard",
    noIndex: true,
});

function getDisplayName(user: Awaited<ReturnType<typeof requireUser>>) {
    return (
        user.user_metadata?.full_name ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Client"
    );
}

export default async function DashboardPage() {
    const user = await requireUser();
    const displayName = getDisplayName(user);

    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7 lg:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                        <SectionIntro
                            eyebrow="Client dashboard"
                            title={`${displayName ? `${displayName}'s Dashboard` : "Your Dashboard"}`}
                            description="Request new bookings, track confirmations, review policies, and keep your contact details updated for appointment reminders."
                            align="left"
                        />

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Link href="/booking/new" className="btn-primary">
                                Start Booking
                                <FiArrowRight className="h-4 w-4" />
                            </Link>

                            <Link href="/profile" className="btn-secondary">
                                Complete Profile
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <StatusCard
                            icon={<FiClock className="h-5 w-5" />}
                            label="Pending requests"
                            value="0"
                        />
                        <StatusCard
                            icon={<FiCheckCircle className="h-5 w-5" />}
                            label="Confirmed bookings"
                            value="0"
                        />
                        <StatusCard
                            icon={<FiCreditCard className="h-5 w-5" />}
                            label="Available credits"
                            value="$0"
                        />
                    </div>
                </div>
            </section>

            
            <QuickActions />
        </div>
    );
}
