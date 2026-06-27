export default function AdminStatusPill({
    label,
    tone = "neutral",
    className = "",
}: {
    label: string;
    tone?: "neutral" | "success" | "warning" | "danger";
    className?: string;
}) {
    const toneClass = {
        neutral: "border-border/60 bg-background text-muted",
        success: "border-green-200 bg-green-50 text-success",
        warning: "border-warning/30 bg-warning-soft text-foreground",
        danger: "border-red-200 bg-red-50 text-red-700",
    }[tone];

    return (
        <span
            className={[
                "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                toneClass,
                className,
            ].join(" ")}
        >
            {label}
        </span>
    );
}
