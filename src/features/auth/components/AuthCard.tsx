export default function AuthCard({
    eyebrow,
    title,
    description,
    children,
    footer,
    topAction,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    topAction?: React.ReactNode;
}) {
    return (
        <section className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto">
            <div className="card overflow-hidden">
                <div className="border-b border-border/60 bg-surface-2/60 px-5 py-5 text-center sm:px-6 sm:py-6">
                    {topAction ? (
                        <div className="px-5 py-4 text-center text-sm text-muted sm:px-6">
                            {topAction}
                        </div>
                    ) : null}

                    {eyebrow ? (
                        <p className="text-sm font-semibold text-dark-green">
                            {eyebrow}
                        </p>
                    ) : null}

                    <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                        {title}
                    </h1>

                    {description ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted">
                            {description}
                        </p>
                    ) : null}
                </div>

                <div className="p-5 sm:p-6">{children}</div>

                {footer ? (
                    <div className="border-t border-border/60 bg-background px-5 py-4 text-center text-sm text-muted sm:px-6">
                        {footer}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
