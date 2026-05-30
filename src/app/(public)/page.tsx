import LandingCTA from "@/components/landing/LandingCTA";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/hero/LandingHero";
import PoliciesSection from "@/components/landing/PoliciesSection";
import PricingOverviewSection from "@/components/landing/PricingOverviewSection";
import { getUser } from "@/lib/auth/get-user";
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
            <LandingHeader
                primaryHref={primaryHref}
                primaryLabel={primaryLabel}
                secondaryHref={secondaryHref}
                secondaryLabel={secondaryLabel}
            />

            <LandingHero
                primaryHref={primaryHref}
                primaryLabel={primaryLabel}
                secondaryHref={secondaryHref}
                secondaryLabel={secondaryLabel}
                settings={landingData.settings}
            />

            <PricingOverviewSection pricingCards={landingData.pricingCards} />

            <PoliciesSection
                policies={landingData.policies}
                settings={landingData.settings}
            />

            <LandingCTA
                primaryHref={primaryHref}
                primaryLabel={primaryLabel}
                secondaryHref={secondaryHref}
                secondaryLabel={secondaryLabel}
            />
        </main>
    );
}
