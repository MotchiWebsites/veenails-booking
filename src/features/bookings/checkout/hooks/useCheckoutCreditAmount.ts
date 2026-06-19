"use client";

import { useEffect, useMemo, useState } from "react";

function roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
}

function clampCreditAmount(value: number, maxEligibleCreditAmount: number) {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return roundCurrency(Math.min(Math.max(0, value), maxEligibleCreditAmount));
}

export function useCheckoutCreditAmount({
    totalActiveAmount,
    estimateTotal,
}: {
    totalActiveAmount: number;
    estimateTotal: number;
}) {
    const [creditAmount, setCreditAmount] = useState(0);
    const maxEligibleCreditAmount = useMemo(
        () => roundCurrency(Math.min(totalActiveAmount, estimateTotal)),
        [estimateTotal, totalActiveAmount],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setCreditAmount((current) =>
                clampCreditAmount(current, maxEligibleCreditAmount),
            );
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [maxEligibleCreditAmount]);

    function setCreditAmountSafely(value: number) {
        setCreditAmount(clampCreditAmount(value, maxEligibleCreditAmount));
    }

    function useAllEligibleCredit() {
        setCreditAmount(maxEligibleCreditAmount);
    }

    function clearCredit() {
        setCreditAmount(0);
    }

    return {
        creditAmount,
        setCreditAmountSafely,
        maxEligibleCreditAmount,
        useAllEligibleCredit,
        clearCredit,
        totalAfterCredit: roundCurrency(
            Math.max(0, estimateTotal - creditAmount),
        ),
    };
}
