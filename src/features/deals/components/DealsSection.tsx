import Link from "next/link";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import type { DealView } from "@/features/deals/data/deals";

const statusToneClasses: Record<DealView["statusTone"], string> = {
    active: "bg-pink-50 text-pink-main",
    claimed: "bg-warning-soft text-warning",
    applied: "bg-success-soft text-success",
};

export default function DealsSection({
    id = "deals",
    deals,
    primaryHref,
    primaryLabel,
}: {
    id?: string;
    deals: DealView[];
    primaryHref: string;
    primaryLabel: string;
}) {
    if (deals.length === 0) {
        return null;
    }

    return (
        <section id={id} className="px-5 sm:px-6">
            <div className="mx-auto max-w-6xl rounded-3xl border border-border/60 bg-linear-to-br from-surface to-green-50/80 p-5 shadow-sm sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <SectionIntro
                        eyebrow="Limited-time offers"
                        title="Current Deals"
                        description="Active promotions are shown here so clients can spot them before starting a booking request."
                        align="left"
                    />

                    <Link href={primaryHref} className="btn-secondary">
                        {primaryLabel}
                    </Link>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                    {deals.map((deal) => (
                        <article
                            key={deal.id}
                            className="rounded-2xl border border-border/60 bg-background/90 p-5 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-green">
                                        Promo code
                                    </p>
                                    <h3 className="mt-2 text-xl font-semibold text-foreground">
                                        {deal.title}
                                    </h3>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                                        {deal.code}
                                    </span>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusToneClasses[deal.statusTone]}`}
                                    >
                                        {deal.statusLabel}
                                    </span>
                                </div>
                            </div>

                            <p className="mt-4 text-base font-semibold text-pink-main">
                                {deal.valueLabel}
                            </p>

                            <p className="mt-3 text-sm leading-relaxed text-muted">
                                {deal.description ||
                                    "Available for a limited time during the current booking window."}
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted">
                                {deal.windowLabel ? (
                                    <span className="rounded-full border border-border/60 bg-surface px-3 py-1">
                                        {deal.windowLabel}
                                    </span>
                                ) : null}

                                {deal.maxUsesLabel ? (
                                    <span className="rounded-full border border-border/60 bg-surface px-3 py-1">
                                        {deal.maxUsesLabel}
                                    </span>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
