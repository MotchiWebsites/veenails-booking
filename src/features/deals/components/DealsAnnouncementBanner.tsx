import Link from "next/link";
import type { DealView } from "@/features/deals/data/deals";

const statusToneClasses: Record<DealView["statusTone"], string> = {
    active: "bg-pink-50 text-pink-main",
    claimed: "bg-warning-soft text-warning",
    applied: "bg-success-soft text-success",
};

export default function DealsAnnouncementBanner({
    deals,
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
    className = "",
}: {
    deals: DealView[];
    primaryHref: string;
    primaryLabel: string;
    secondaryHref?: string;
    secondaryLabel?: string;
    className?: string;
}) {
    if (deals.length === 0) {
        return null;
    }

    const featuredDeal = deals[0];
    const remainingDealsCount = deals.length - 1;

    return (
        <section
            aria-label="Current deals"
            className={`border-b border-border/50 bg-linear-to-r from-green-50 via-surface-soft to-pink-50 ${className}`}
        >
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-background">
                            Active deal
                        </span>

                        <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusToneClasses[featuredDeal.statusTone]}`}
                        >
                            {featuredDeal.statusLabel}
                        </span>

                        <span className="rounded-full border border-border/70 bg-surface px-3 py-1 text-xs font-semibold text-foreground">
                            Code {featuredDeal.code}
                        </span>
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground sm:text-base">
                            {featuredDeal.bannerLabel} Use code{" "}
                            <span className="text-pink-main">
                                {featuredDeal.code}
                            </span>
                            .
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                            {featuredDeal.title}
                            {featuredDeal.description
                                ? ` - ${featuredDeal.description}`
                                : ""}
                            {featuredDeal.windowLabel
                                ? ` ${featuredDeal.windowLabel}.`
                                : ""}
                            {remainingDealsCount > 0
                                ? ` Plus ${remainingDealsCount} more active offer${remainingDealsCount === 1 ? "" : "s"}.`
                                : ""}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {secondaryHref && secondaryLabel ? (
                        <Link href={secondaryHref} className="btn-ghost">
                            {secondaryLabel}
                        </Link>
                    ) : null}

                    <Link href={primaryHref} className="btn-soft">
                        {primaryLabel}
                    </Link>
                </div>
            </div>
        </section>
    );
}
