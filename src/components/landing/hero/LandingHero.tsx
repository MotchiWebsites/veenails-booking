import Image from "next/image";
import Link from "next/link";
import {
    FiUser,
    FiCalendar,
    FiCheckCircle,
    FiShield,
} from "react-icons/fi";
import type { LandingSettings } from "@/types/landing";
import SectionIntro from "@/components/landing/SectionIntro";
import HeroStep from "@/components/landing/hero/HeroStep";
import AnimatedArrowLink from "@/components/ui/AnimatedArrowLink";
import Reveal from "@/components/motion/Reveal";

export default function LandingHero({
    id = "overview",
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
}: {
    id?: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
    settings: LandingSettings;
}) {
    const steps = [
        {
            icon: <FiUser className="h-4 w-4" />,
            title: "Sign in or create an account",
            description: "Your account allows you to manage appointments, payments, and preferences all in one place."
        },
        {
            icon: <FiCalendar className="h-4 w-4" />,
            title: "Pick an available time",
            description: "Your selected slot is temporarily held while you complete the request."
        },
        {
            icon: <FiCheckCircle className="h-4 w-4" />,
            title: "Confirm services and policies",
            description: "Pricing, design tiers, removals, and policies are shown before submission."
        }
    ];
    
    return (
        <section
            id={id}
            className="px-5 sm:px-6 flex flex-col items-center gap-10 pt-10"
        >
            <div className="w-full flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-4 py-2 text-xs font-semibold text-muted shadow-sm">
                    <FiShield className="h-4 w-4 text-dark-green" />
                    Secure online booking
                </div>

                <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                    Vee&apos;s Nail Studio | Book Your Appointment
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base lg:text-lg">
                    Choose an available time, review services and policies, send
                    your deposit, and track your appointment status from your
                    account.
                </p>

                {/* logo centered above the title for stronger branding */}
                <div className="mt-5">
                    <div className="relative w-24 h-24 lg:w-36 lg:h-36 mx-auto overflow-hidden rounded-full border border-border bg-background shadow-sm">
                        <Image
                            src="/logo.png"
                            alt="Vee's Nail Studio"
                            fill
                            sizes="500px"
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>

                <div className="mt-7 flex flex-col gap-3">
                    <Link href={secondaryHref} className="btn-secondary">
                        {secondaryLabel}
                    </Link>
                    <AnimatedArrowLink href={primaryHref}>
                        {primaryLabel}
                    </AnimatedArrowLink>
                </div>
            </div>

            <div className="card overflow-hidden p-5 sm:p-6">
                <div className="rounded-3xl bg-surface-2/70 p-5 sm:p-6">
                    <SectionIntro
                        eyebrow="How it works"
                        title="Booking Flow Overview"
                        description="The booking portal guides you through each step of the appointment process. Sign in to begin right away!"
                    />

                    <div className="mt-5 space-y-3">
                        {steps.map((step, index) => (
                            <Reveal key={index} delay={index * 0.06}>
                                <HeroStep
                                    icon={step.icon}
                                    title={step.title}
                                    description={step.description}
                                />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
