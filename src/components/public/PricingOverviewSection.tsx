import type { LandingPricingCard } from "@/types/landing";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import Reveal from "../shared/motion/Reveal";

export default function PricingOverviewSection({
    id = "pricing",
    pricingCards,
}: {
    id?: string;
    pricingCards: LandingPricingCard[];
}) {
    return (
        <section id={id} className="px-5 sm:px-6">
            <div className="mx-auto max-w-6xl">
                <div className="rounded-3xl border border-border/60 bg-surface-2/70 p-5 shadow-sm sm:p-8">
                    <SectionIntro
                        eyebrow="How much will it cost?"
                        title="Pricing Overview"
                        description="The final booking flow shows the exact services, add-ons, design tiers, and deposit before you submit your request."
                    />

                    <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {pricingCards.map((item, index) => (
                            <Reveal key={item.id} delay={index * 0.06}>
                                <article className="rounded-2xl border border-border/50 bg-background p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-base font-semibold">
                                            {item.title}
                                        </h3>

                                        <p className="shrink-0 rounded-full bg-pink-50 px-3 py-1 text-sm font-semibold text-pink-main">
                                            {item.priceLabel}
                                        </p>
                                    </div>

                                    <p className="mt-3 text-sm leading-relaxed text-muted">
                                        {item.description}
                                    </p>
                                </article>
                            </Reveal>
                        ))}
                    </div>

                    <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-muted sm:text-sm">
                        Prices may change based on nail condition, final design
                        complexity, removals, add-ons, or service changes
                        approved during the appointment.
                    </p>
                </div>
            </div>
        </section>
    );
}
