import { FiArrowLeft, FiArrowRight, FiRefreshCw } from "react-icons/fi";

export default function AvailabilityCalendarHeader({
    dateRange,
    canGoBack,
    canGoForward,
    onToday,
    onPrevious,
    onNext,
}: {
    dateRange: string;
    canGoBack: boolean;
    canGoForward: boolean;
    onToday: () => void;
    onPrevious: () => void;
    onNext: () => void;
}) {
    return (
        <div className="flex flex-col gap-4 border-b border-border/60 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <p className="text-sm font-semibold text-dark-green">
                    Availability
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                    Upcoming openings
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    {dateRange}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onToday}
                    disabled={!canGoBack}
                    className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
                    Today
                </button>
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={!canGoBack}
                    aria-label="Show earlier dates"
                    className="btn-secondary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canGoForward}
                    aria-label="Show later dates"
                    className="btn-secondary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FiArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
