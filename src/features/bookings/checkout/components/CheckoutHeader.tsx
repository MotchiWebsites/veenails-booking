import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function CheckoutHeader() {
    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm sm:p-7">
            <Link href="/book" className="btn-ghost inline-flex items-center gap-2">
                <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to booking
            </Link>

            <div className="mt-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-dark-green">
                    Checkout
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Confirm Your Deposit
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                    Review your appointment, accept the booking policies, apply
                    any credits, and use the deposit instructions before sending
                    your request to the studio.
                </p>
            </div>
        </section>
    );
}
