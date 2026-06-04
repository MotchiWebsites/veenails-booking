import Reveal from "@/components/motion/Reveal";
import FloatingSectionNav from "@/components/navigation/FloatingSectionNav";

import LandingCTA from "@/components/landing/LandingCTA";
import LandingHero from "@/components/landing/hero/LandingHero";
import PoliciesSection from "@/components/landing/PoliciesSection";
import PricingOverviewSection from "@/components/landing/PricingOverviewSection";

import { getUser } from "@/features/auth/guards/get-user";
import { getLandingData } from "@/lib/data/landing";

export default async function PublicLandingPage() {
    const [user, landingData] = await Promise.all([
        getUser(),
        getLandingData(),
    ]);

    const primaryHref = user ? "/booking/new" : "/signup";
    const primaryLabel = user ? "Start Booking" : "Create Account";

    const secondaryHref = user ? "/dashboard" : "/login";
    const secondaryLabel = user ? "Go to Dashboard" : "Sign In";

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col space-y-16 pb-16">
            <FloatingSectionNav
                items={[
                    { id: "overview", label: "Overview" },
                    { id: "pricing", label: "Pricing" },
                    { id: "policies", label: "Policies" },
                    { id: "booking", label: "Book Now" },
                ]}
            />

            <Reveal>
                <LandingHero
                    id="overview"
                    primaryHref={primaryHref}
                    primaryLabel={primaryLabel}
                    secondaryHref={secondaryHref}
                    secondaryLabel={secondaryLabel}
                    settings={landingData.settings}
                />
            </Reveal>

            <Reveal>
                <PricingOverviewSection
                    id="pricing"
                    pricingCards={landingData.pricingCards}
                />
            </Reveal>

            <Reveal>
                <PoliciesSection
                    id="policies"
                    policies={landingData.policies}
                />
            </Reveal>

            <Reveal>
                <LandingCTA
                    id="booking"
                    primaryHref={primaryHref}
                    primaryLabel={primaryLabel}
                    secondaryHref={secondaryHref}
                    secondaryLabel={secondaryLabel}
                />
            </Reveal>
        </main>
    );
}
