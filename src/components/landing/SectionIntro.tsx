export default function SectionIntro({
    eyebrow,
    title,
    description,
    align = "center",
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    align?: "left" | "center";
}) {
    return (
        <div
            className={
                align === "center"
                    ? "mx-auto max-w-2xl text-center"
                    : "max-w-2xl text-left"
            }
        >
            {eyebrow ? (
                <p className="text-sm font-semibold text-dark-green">
                    {eyebrow}
                </p>
            ) : null}

            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {title}
            </h2>

            {description ? (
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                    {description}
                </p>
            ) : null}
        </div>
    );
}
