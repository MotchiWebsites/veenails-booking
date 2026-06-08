import {
    getCreditReason,
    getCreditStatus,
    type CreditStatus,
    type UserCreditRow,
} from "@/features/credits/lib/credits";
import { formatCurrency } from "@/lib/utils/money";

function formatFriendlyDate(value: string | null, fallback = "No expiry") {
    if (!value) {
        return fallback;
    }

    return new Intl.DateTimeFormat("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

function getStatusBadgeClasses(status: CreditStatus) {
    switch (status) {
        case "Available":
            return "bg-success-soft text-success";
        case "Used":
            return "bg-info-soft text-info";
        case "Expired":
            return "bg-warning-soft text-warning";
        case "Inactive":
            return "bg-surface-2 text-muted";
        default:
            return "bg-surface-2 text-muted";
    }
}

export default function CreditCard({
    credit,
    muted = false,
}: {
    credit: UserCreditRow;
    muted?: boolean;
}) {
    const status = getCreditStatus(credit);

    return (
        <article
            className={[
                "rounded-3xl border p-5 shadow-sm sm:p-6",
                muted
                    ? "border-border/50 bg-surface/75 text-foreground"
                    : "border-border/60 bg-surface",
            ].join(" ")}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-dark-green">
                        {getCreditReason(credit.reason)}
                    </p>
                    <p
                        className={[
                            "mt-2 text-3xl font-semibold tracking-tight",
                            muted ? "text-foreground/85" : "text-foreground",
                        ].join(" ")}
                    >
                        {formatCurrency(credit.amount, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        {status === "Available"
                            ? "This credit can be applied toward a future booking, subject to your booking flow."
                            : "This credit is part of your account history and is no longer available for future use."}
                    </p>
                </div>

                <span
                    className={[
                        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusBadgeClasses(status),
                    ].join(" ")}
                >
                    {status}
                </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Created
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                        {formatFriendlyDate(credit.created_at, "Unknown")}
                    </p>
                </div>

                <div className="rounded-2xl bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Expiry
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                        {formatFriendlyDate(credit.expires_at)}
                    </p>
                </div>

                {credit.used_at ? (
                    <div className="rounded-2xl bg-background p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Used
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                            {formatFriendlyDate(credit.used_at, "Not used")}
                        </p>
                    </div>
                ) : null}

                {credit.source_booking_id ? (
                    <div className="rounded-2xl bg-background p-3 sm:col-span-2 xl:col-span-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Source booking
                        </p>
                        <p className="mt-1 break-all text-sm font-medium text-foreground">
                            {credit.source_booking_id}
                        </p>
                    </div>
                ) : null}
            </div>
        </article>
    );
}
