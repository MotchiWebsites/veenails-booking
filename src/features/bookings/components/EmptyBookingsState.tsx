import Link from "next/link";
import { FiCalendar } from "react-icons/fi";

export default function EmptyBookingsState({
    title,
    description,
    showAction = false,
}: {
    title: string;
    description: string;
    showAction?: boolean;
}) {
    return (
        <div className="rounded-3xl border border-dashed border-border bg-background p-6 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pink-main/10 text-pink-main">
                <FiCalendar className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
                {title}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                {description}
            </p>
            {showAction ? (
                <Link href="/book" className="btn-primary mt-5 inline-flex">
                    Book Appointment
                </Link>
            ) : null}
        </div>
    );
}
