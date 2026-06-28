"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateCheckoutPaymentPlan } from "@/features/bookings/utils/booking-ledger";

function clampCreditAmount(value: number, maxEligibleCreditAmount: number) {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.round(
        Math.min(Math.max(0, value), maxEligibleCreditAmount) * 100,
    ) / 100;
}

export function useCheckoutCreditAmount({
    totalActiveAmount,
    estimateTotal,
    depositAmount,
}: {
    totalActiveAmount: number;
    estimateTotal: number;
    depositAmount: number;
}) {
    const [creditAmount, setCreditAmount] = useState(0);
    const paymentPlan = useMemo(
        () =>
            calculateCheckoutPaymentPlan({
                appointmentTotal: estimateTotal,
                configuredDeposit: depositAmount,
                creditAmount,
            }),
        [creditAmount, depositAmount, estimateTotal],
    );
    const maxEligibleCreditAmount = useMemo(
        () => Math.min(totalActiveAmount, paymentPlan.maxCreditAmount),
        [paymentPlan.maxCreditAmount, totalActiveAmount],
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
        totalAfterCredit: paymentPlan.totalAfterCredit,
        depositDue: paymentPlan.depositDue,
        balanceAfterDeposit: paymentPlan.balanceAfterDeposit,
    };
}
