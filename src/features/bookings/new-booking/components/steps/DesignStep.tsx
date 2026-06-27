"use client";

import Image from "next/image";
import Link from "next/link";
import { FiExternalLink } from "react-icons/fi";
import type { DesignTier } from "@/features/bookings/new-booking/types";
import { formatPrice } from "@/features/bookings/new-booking/utils/booking-flow-formatters";

type DesignStepProps = {
    designTiers: DesignTier[];
    selectedDesignTierId: DesignTier["id"] | null;
    onSelectDesignTier: (tierId: DesignTier["id"]) => void;
};

export default function DesignStep({
    designTiers,
    selectedDesignTierId,
    onSelectDesignTier,
}: DesignStepProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Choose a design tier
                </h2>
                <p className="text-sm leading-relaxed text-muted sm:text-base">
                    Design tier is required for full-service appointments and is
                    added on top of the selected base price.
                </p>
            </div>

            <Link
                href="https://veenailstudio.ca/pricing#design-tiers"
                target="_blank"
                rel="noreferrer noopener"
                className="link-default inline-flex items-center gap-2 text-sm font-medium"
            >
                Need inspiration? View the full design guide
                <FiExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>

            <div className="grid gap-4 xl:grid-cols-2">
                {designTiers.map((tier) => {
                    const selected = selectedDesignTierId === tier.id;

                    return (
                        <button
                            key={tier.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onSelectDesignTier(tier.id)}
                            className={[
                                "clickable rounded-3xl border p-4 text-left shadow-sm transition-all duration-200",
                                selected
                                    ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                    : "border-border/60 bg-background hover:border-pink-200 hover:bg-pink-50/70",
                            ].join(" ")}
                        >
                            {tier.imageSrc ? (
                                <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-surface-2 sm:aspect-5/4 xl:aspect-4/5">
                                    <Image
                                        src={tier.imageSrc}
                                        alt={tier.imageAlt}
                                        width={1000}
                                        height={1000}
                                        priority
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2 px-4 text-center text-sm text-muted">
                                    Preview coming soon
                                </div>
                            )}

                            <div className="mt-4 flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        {tier.label}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted">
                                        {tier.description ??
                                            "Add-on design detail tier"}
                                    </p>
                                </div>
                                <span className="text-base font-semibold text-foreground">
                                    +{formatPrice(tier.price)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
