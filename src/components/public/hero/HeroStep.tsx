export default function HeroStep({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-3 rounded-2xl bg-background p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-pink-main">
                {icon}
            </div>

            <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                    {description}
                </p>
            </div>
        </div>
    );
}
