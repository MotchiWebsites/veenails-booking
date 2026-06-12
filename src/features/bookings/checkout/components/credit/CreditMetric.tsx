export default function CreditMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-3xl border border-border/60 bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
                {value}
            </p>
        </div>
    );
}
