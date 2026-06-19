export default function SummaryRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
            <p className="text-xs md:text-sm xl:text-base font-semibold uppercase tracking-[0.22em] text-muted">
                {label}
            </p>
            <p className="mt-2 text-sm lg:text-base font-semibold leading-relaxed text-foreground">
                {value}
            </p>
        </div>
    );
}
