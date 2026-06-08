export default function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex gap-3 rounded-2xl bg-background p-3">
            <div className="mt-0.5 text-pink-main">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {label}
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                    {value}
                </p>
            </div>
        </div>
    );
}