import Link from "next/link";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import AnimatedArrowLink from "../ui/AnimatedArrowLink";

export default function LandingCTA({
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
}: {
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
}) {
    return (
        <section className="px-5 sm:px-6">
            <div className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-surface p-6 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-pink-main">
                    <FiCalendar className="h-6 w-6" />
                </div>

                <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                    Ready to request your appointment?
                </h2>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                    Create an account or sign in to choose a time, review
                    services, accept the policies, and submit your deposit
                    confirmation.
                </p>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link href={secondaryHref} className="btn-secondary">
                        {secondaryLabel}
                    </Link>
                    <AnimatedArrowLink href={primaryHref}>{primaryLabel}</AnimatedArrowLink>
                </div>
            </div>
        </section>
    );
}
