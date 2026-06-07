import { FiClock, FiCreditCard, FiLayers } from "react-icons/fi";

import Reveal from "@/components/shared/motion/Reveal";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import StatusCard from "@/features/dashboard/components/StatusCard";
import type { CreditsPageData } from "@/features/credits/data/credits";
import CreditsTableSection from "@/features/credits/components/CreditsTableSection";
import { formatCurrency } from "@/lib/utils/money";

function EmptyPanel({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-3xl border border-dashed border-border/70 bg-surface p-6 text-center shadow-sm sm:p-8">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                {description}
            </p>
        </div>
    );
}

export default function CreditsPageView({
    data,
}: {
    data: CreditsPageData;
}) {
    const hasAnyCredits = data.activeCount > 0 || data.historicalCount > 0;

    return (
        <div className="space-y-6 pb-12 lg:space-y-8">
            <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-7 lg:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <SectionIntro
                        eyebrow="Account"
                        title="Credits"
                        description="View account credits available for future appointments and past credits that have already been used or expired."
                        align="left"
                    />

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <StatusCard
                            icon={<FiCreditCard className="h-5 w-5" />}
                            label="Total active credit"
                            value={formatCurrency(data.totalActiveAmount, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        />
                        <StatusCard
                            icon={<FiLayers className="h-5 w-5" />}
                            label="Active credits"
                            value={String(data.activeCount)}
                        />
                        <StatusCard
                            icon={<FiClock className="h-5 w-5" />}
                            label="Historical credits"
                            value={String(data.historicalCount)}
                        />
                    </div>
                </div>
            </section>

            {!hasAnyCredits ? (
                <Reveal>
                    <EmptyPanel
                        title="No credits yet"
                        description="If a booking deposit is credited back to your account, it will appear here."
                    />
                </Reveal>
            ) : (
                <>
                    <section className="space-y-4">
                        <Reveal>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold sm:text-2xl">
                                        Active / Unused Credits
                                    </h2>
                                    <p className="mt-1 text-sm text-muted sm:text-base">
                                        Available credits may be used toward a future booking.
                                    </p>
                                </div>
                            </div>
                        </Reveal>

                        <Reveal delay={0.04}>
                            <CreditsTableSection
                                credits={data.activeCredits}
                                section="active"
                                emptyTitle="You do not have any available credits right now."
                                emptyDescription="When an eligible deposit or account adjustment is added back to your balance, it will appear here for future bookings."
                            />
                        </Reveal>
                    </section>

                    <section className="space-y-4">
                        <Reveal delay={0.08}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold sm:text-2xl">
                                        Used / Expired Credits
                                    </h2>
                                    <p className="mt-1 text-sm text-muted sm:text-base">
                                        Review past credits that have already been used or have expired.
                                    </p>
                                </div>
                            </div>
                        </Reveal>

                        <Reveal delay={0.12}>
                            <CreditsTableSection
                                credits={data.historicalCredits}
                                section="history"
                                emptyTitle="No used or expired credits yet."
                                emptyDescription="Your credit history will show here once a credit has been used or expires."
                            />
                        </Reveal>
                    </section>
                </>
            )}
        </div>
    );
}
