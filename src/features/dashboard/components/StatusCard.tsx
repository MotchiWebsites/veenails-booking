export default function StatusCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-border/50 bg-background p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-pink-main">
                    {icon}
                </div>

                <div>
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="text-xs text-muted sm:text-sm">{label}</p>
                </div>
            </div>
        </div>
    );
}