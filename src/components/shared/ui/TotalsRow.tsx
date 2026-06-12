export default function TotalsRow({
    label,
    value,
    prominent = false,
}: {
    label: string;
    value: string;
    prominent?: boolean;
}) {
    return (
        <div className="mt-3 flex items-center justify-between gap-3 first:mt-0">
            <span
                className={
                    prominent
                        ? "text-sm font-semibold text-foreground"
                        : "text-sm text-muted"
                }
            >
                {label}
            </span>
            <span
                className={
                    prominent
                        ? "text-lg font-semibold text-foreground"
                        : "text-sm font-semibold text-foreground"
                }
            >
                {value}
            </span>
        </div>
    );
}
