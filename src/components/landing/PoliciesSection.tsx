import PolicyAccordionCard from "@/components/landing/PolicyAccordionCard";
import SectionIntro from "@/components/landing/SectionIntro";
import type { LandingPolicy } from "@/types/landing";
import Reveal from "../motion/Reveal";

export default function PoliciesSection({
    id = "policies",
    policies,
}: {
    id?: string;
    policies: LandingPolicy[];
}) {
    return (
        <section id={id} className="px-5 sm:px-6">
            <div className="mx-auto max-w-6xl">
                <SectionIntro
                    eyebrow="Review our policies"
                    title="Booking Policies"
                    description="You will be asked to accept the current booking policies during checkout. They are also shown here as a reference."
                />
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {policies.map((policy, index) => (
                        <Reveal key={policy.id} delay={index * 0.06}>
                            <PolicyAccordionCard policy={policy} />
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
