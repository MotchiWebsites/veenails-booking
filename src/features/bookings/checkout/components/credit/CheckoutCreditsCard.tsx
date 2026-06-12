import { FiCreditCard } from "react-icons/fi";

import StepSectionCard from "@/components/shared/ui/StepSectionCard";
import TotalsRow from "@/components/shared/ui/TotalsRow";
import { formatAmount } from "@/features/bookings/checkout/utils/checkout-formatters";
import type { CreditsPageData } from "@/features/credits/data/credits";

import CreditMetric from "./CreditMetric";

export default function CheckoutCreditsCard({
    credits,
    creditAmount,
    maxEligibleCreditAmount,
    estimateTotal,
    totalAfterCredit,
    setCreditAmountSafely,
    useAllEligibleCredit,
    clearCredit,
}: {
    credits: CreditsPageData;
    creditAmount: number;
    maxEligibleCreditAmount: number;
    estimateTotal: number;
    totalAfterCredit: number;
    setCreditAmountSafely: (value: number) => void;
    useAllEligibleCredit: () => void;
    clearCredit: () => void;
}) {
    const hasActiveCredit = credits.activeCount > 0;
    const canApplyCredit = hasActiveCredit && maxEligibleCreditAmount > 0;
    const hasSelectedCredit = creditAmount > 0;

    return (
        <StepSectionCard
            icon={<FiCreditCard className="h-5 w-5" aria-hidden="true" />}
            title="Apply account credit"
            description={
                hasActiveCredit
                    ? "You can use available account credit to lower the remaining cost of this appointment."
                    : "This step is optional. You do not currently have account credit to apply."
            }
        >
            {!hasActiveCredit ? (
                <div className="rounded-3xl border border-dashed border-border/60 bg-background p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-base font-semibold text-foreground">
                                No credit available
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                You can skip this step. Your booking can still
                                be submitted normally after you confirm the
                                deposit and policies.
                            </p>
                        </div>

                        <span className="inline-flex w-fit rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                            Skipped
                        </span>
                    </div>

                    <div className="mt-5 rounded-3xl bg-surface p-4">
                        <TotalsRow
                            label="Estimated total"
                            value={formatAmount(estimateTotal, true)}
                            prominent
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="rounded-3xl border border-border/60 bg-background p-4">
                        <div className="flex flex-col gap-12 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-base font-semibold text-foreground">
                                    Credit is optional
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-muted">
                                    Choose how much credit to apply. This
                                    reduces the remaining appointment total, but
                                    you may still need to confirm your deposit
                                    so the studio can hold and review your
                                    request.
                                </p>
                            </div>

                            <span
                                className={[
                                    "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                                    hasSelectedCredit
                                        ? "bg-green-50 text-success"
                                        : "bg-surface text-muted",
                                ].join(" ")}
                            >
                                {hasSelectedCredit
                                    ? `${formatAmount(creditAmount, true)} applied`
                                    : "Not applied"}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <CreditMetric
                            label="Available"
                            value={formatAmount(
                                credits.totalActiveAmount,
                                true,
                            )}
                        />
                        <CreditMetric
                            label="Can apply"
                            value={formatAmount(maxEligibleCreditAmount, true)}
                        />
                        <CreditMetric
                            label="Selected"
                            value={formatAmount(creditAmount, true)}
                        />
                    </div>

                    <div className="rounded-3xl border border-border/60 bg-background p-4 sm:p-5">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                            <label className="block" htmlFor="creditAmount">
                                <span className="label-text">
                                    Credit amount to apply
                                </span>

                                <div className="relative mt-2">
                                    <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-base font-medium text-muted">
                                        $
                                    </span>

                                    <input
                                        id="creditAmount"
                                        name="creditAmountDisplay"
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        max={maxEligibleCreditAmount}
                                        step="0.01"
                                        value={
                                            creditAmount === 0
                                                ? ""
                                                : String(creditAmount)
                                        }
                                        onChange={(event) =>
                                            setCreditAmountSafely(
                                                Number(event.target.value || 0),
                                            )
                                        }
                                        disabled={!canApplyCredit}
                                        aria-describedby="credit-amount-helper"
                                        className="input-field pl-8 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </div>

                                <p
                                    id="credit-amount-helper"
                                    className="mt-2 text-xs leading-relaxed text-muted"
                                >
                                    You can apply up to{" "}
                                    <span className="font-semibold text-foreground">
                                        {formatAmount(
                                            maxEligibleCreditAmount,
                                            true,
                                        )}
                                    </span>{" "}
                                    to this appointment.
                                </p>
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                                <button
                                    type="button"
                                    onClick={useAllEligibleCredit}
                                    disabled={!canApplyCredit}
                                    className="btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Use all credit
                                </button>

                                <button
                                    type="button"
                                    onClick={clearCredit}
                                    disabled={!hasSelectedCredit}
                                    className="btn-secondary justify-center disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 rounded-3xl bg-surface p-4">
                            <TotalsRow
                                label="Before credit"
                                value={formatAmount(estimateTotal, true)}
                            />

                            {hasSelectedCredit ? (
                                <TotalsRow
                                    label="Credit applied"
                                    value={`-${formatAmount(creditAmount, true)}`}
                                />
                            ) : null}

                            <div className="mt-4 border-t border-border/60 pt-4">
                                <TotalsRow
                                    label={
                                        hasSelectedCredit
                                            ? "After credit"
                                            : "Estimated total"
                                    }
                                    value={formatAmount(totalAfterCredit, true)}
                                    prominent
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </StepSectionCard>
    );
}
