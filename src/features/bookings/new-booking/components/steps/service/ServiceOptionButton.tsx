import type { ServiceOption } from "@/features/bookings/new-booking/types";
import { formatPrice } from "@/features/bookings/new-booking/utils/booking-flow-formatters";

export default function ServiceOptionButton({
    option,
    selected,
    onSelect,
    showGroupLabel = false,
}: {
    option: ServiceOption;
    selected: boolean;
    onSelect: (optionId: ServiceOption["id"]) => void;
    showGroupLabel?: boolean;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.id)}
            className={[
                "clickable rounded-3xl border px-5 py-4 text-left shadow-sm transition-all duration-200",
                selected
                    ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                    : "border-border/60 bg-surface hover:border-pink-200 hover:bg-pink-50/70",
            ].join(" ")}
        >
            <div className="flex w-full items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    {showGroupLabel && option.groupLabel ? (
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                            {option.groupLabel}
                        </p>
                    ) : null}

                    <h4 className="truncate text-base font-semibold leading-tight text-foreground">
                        {option.label}
                    </h4>

                    {option.helperText ? (
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                            {option.helperText}
                        </p>
                    ) : null}
                </div>

                <span className="shrink-0 whitespace-nowrap text-base font-semibold leading-none text-foreground">
                    {formatPrice(option.price)}
                </span>
            </div>
        </button>
    );
}
