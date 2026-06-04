import Link from "next/link";
import { FiCalendar } from "react-icons/fi";
import AnimatedArrowLink from "../ui/AnimatedArrowLink";

export default function LandingCTA({
    id = "booking",
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
}) {
    return (
        <section id={id} className="px-5 sm:px-6">
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

                <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                    <Link
                        href={secondaryHref}
                        className="btn-secondary w-full sm:w-auto"
                    >
                        {secondaryLabel}
                    </Link>
                    <AnimatedArrowLink
                        href={primaryHref}
                        className="btn-primary w-full sm:w-auto"
                    >
                        {primaryLabel}
                    </AnimatedArrowLink>
                </div>
            </div>
        </section>
    );
}
