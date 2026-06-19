import type { ReactNode } from "react";

export default function StepSectionCard({
    icon,
    title,
    description,
    children,
    footer,
    className = "",
    contentClassName = "",
}: {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    className?: string;
    contentClassName?: string;
}) {
    return (
        <section
            className={[
                "rounded-3xl border border-border/60 bg-surface p-5 shadow-sm sm:p-6",
                className,
            ].join(" ")}
        >
            <div className={icon ? "flex items-start gap-4" : ""}>
                {icon ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-pink-main">
                        {icon}
                    </div>
                ) : null}
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-foreground">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>

            {children ? (
                <div className={["mt-5", contentClassName].join(" ")}>
                    {children}
                </div>
            ) : null}

            {footer ? <div className="mt-5">{footer}</div> : null}
        </section>
    );
}
