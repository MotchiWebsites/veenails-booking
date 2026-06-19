export default function SummaryBlock({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-xs md:text-sm xl:text-base font-semibold uppercase tracking-[0.22em] text-muted">
                {label}
            </p>
            <p className="mt-2 text-sm md:text-base xl:text-lg font-semibold leading-relaxed text-foreground">
                {value}
            </p>
            <hr className="my-4 border-t border-border/60" />
        </div>
    );
}
