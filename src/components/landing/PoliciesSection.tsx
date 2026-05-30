import PolicyAccordionCard from "@/components/landing/PolicyAccordionCard";
import SectionIntro from "@/components/landing/SectionIntro";
import type { LandingPolicy, LandingSettings } from "@/types/landing";
import { formatCurrency } from "@/lib/utils/money";

export default function PoliciesSection({
    policies,
    settings,
}: {
    policies: LandingPolicy[];
    settings: LandingSettings;
}) {
    return (
        <section className="px-5 sm:px-6">
            <div className="mx-auto max-w-6xl">
                <SectionIntro
                    eyebrow="Review our policies"
                    title="Booking Policies"
                    description="You will be asked to accept the current booking policies during checkout. They are also shown here as a reference."
                />
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {policies.map((policy) => (
                        <PolicyAccordionCard key={policy.id} policy={policy} />
                    ))}
                </div>
            </div>
        </section>
    );
}
