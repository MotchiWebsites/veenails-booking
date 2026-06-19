import Link from "next/link";

export default function AdminPageHeader({
    eyebrow,
    title,
    description,
    actionHref,
    actionLabel,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    actionHref?: string;
    actionLabel?: string;
}) {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
                {eyebrow ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-green">
                        {eyebrow}
                    </p>
                ) : null}
                <h1 className="mt-2 text-2xl font-semibold text-foreground">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                        {description}
                    </p>
                ) : null}
            </div>
            {actionHref && actionLabel ? (
                <Link href={actionHref} className="btn-secondary lg:shrink-0">
                    {actionLabel}
                </Link>
            ) : null}
        </div>
    );
}
