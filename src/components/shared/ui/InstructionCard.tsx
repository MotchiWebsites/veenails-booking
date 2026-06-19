export default function InstructionCard({
    label,
    value,
    helperText,
}: {
    label: string;
    value: string;
    helperText?: string;
}) {
    return (
        <div className="rounded-3xl border border-border/60 bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {label}
            </p>
            <p className="mt-2 select-text break-words text-lg font-semibold text-foreground">
                {value}
            </p>
            {helperText ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
}
