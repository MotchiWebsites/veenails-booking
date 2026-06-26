"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPercent, FiSave } from "react-icons/fi";
import { updateAppointmentDiscountAction } from "@/features/admin/appointments/actions/admin-appointments";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { formatMoney } from "@/features/admin/components/admin-formatters";
import { normalizeBookingFeeRate } from "@/features/bookings/new-booking/utils";
import { useToast } from "@/components/shared/toast/ToastProvider";

const CLOSED_STATUSES = new Set(["completed", "no_show", "cancelled", "rejected", "expired"]);

function roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
}

function parseDiscountPercentage(label: string, fallbackAmount: number, subtotal: number) {
    const match = label.match(/\(([\d.]+)%\)/);
    if (match) {
        const parsed = Number(match[1]);
        if (Number.isFinite(parsed)) return String(parsed);
    }

    if (subtotal > 0 && fallbackAmount > 0) {
        return String(roundCurrency((fallbackAmount / subtotal) * 100));
    }

    return "";
}

function SummaryRow({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{label}</span>
            <span className={emphasized ? "text-base font-semibold text-foreground" : "font-semibold text-foreground"}>{value}</span>
        </div>
    );
}

export default function AdminDiscountEditor({ booking }: { booking: AdminAppointmentDetails }) {
    const router = useRouter();
    const { error, success } = useToast();
    const [state, formAction, pending] = useActionState(updateAppointmentDiscountAction, {});
    const discountItem = booking.lineItems.find((item) => item.itemType === "discount") ?? null;
    const subtotalBeforeDiscount = useMemo(
        () =>
            roundCurrency(
                booking.lineItems
                    .filter((item) => item.itemType !== "discount")
                    .reduce((sum, item) => sum + item.lineTotal, 0),
            ),
        [booking.lineItems],
    );
    const existingDiscountAmount = Math.abs(discountItem?.lineTotal ?? discountItem?.unitPrice ?? 0);
    const [percentage, setPercentage] = useState(() =>
        discountItem ? parseDiscountPercentage(discountItem.label, existingDiscountAmount, subtotalBeforeDiscount) : "",
    );
    const closed = CLOSED_STATUSES.has(booking.status);
    const enteredPercentage = Number(percentage || 0);
    const numericPercentage = Number.isFinite(enteredPercentage) ? Math.min(100, Math.max(0, enteredPercentage)) : 0;
    const discountAmount = Math.min(
        subtotalBeforeDiscount,
        roundCurrency((subtotalBeforeDiscount * (Number.isFinite(numericPercentage) ? numericPercentage : 0)) / 100),
    );
    const updatedSubtotal = Math.max(0, roundCurrency(subtotalBeforeDiscount - discountAmount));
    const bookingFeeRate = normalizeBookingFeeRate(booking.bookingFeeRate);
    const bookingFee = booking.bookingFeeMode === "included_in_price" ? 0 : roundCurrency((updatedSubtotal * bookingFeeRate) / 100);
    const updatedTotal = Math.max(0, roundCurrency(updatedSubtotal + bookingFee));
    const amountDue = Math.max(0, roundCurrency(updatedTotal - booking.amountPaid));

    useEffect(() => {
        if (!state.messageId) return;
        if (state.error) {
            error(state.error, "Discount not saved");
        }
        if (state.success) {
            success(state.success, "Discount updated");
            router.refresh();
        }
    }, [error, router, state.error, state.messageId, state.success, success]);

    return (
        <section className="rounded-3xl border border-border/60 bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Discount</h2>
                    <p className="mt-1 text-sm text-muted">Apply before closing out payment.</p>
                </div>
                <span className="rounded-full bg-background p-2 text-dark-green">
                    <FiPercent aria-hidden="true" />
                </span>
            </div>

            {closed ? (
                <p className="mt-4 rounded-2xl bg-background p-4 text-sm text-muted">
                    This appointment is closed. Pricing changes should go through the correction flow.
                </p>
            ) : (
                <form action={formAction} className="mt-4 space-y-4">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <label className="block space-y-2">
                        <span className="label-text">Percentage</span>
                        <div className="relative">
                            <input
                                name="discountPercentage"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={percentage}
                                onChange={(event) => setPercentage(event.target.value)}
                                className="input-field pr-10"
                                placeholder="0"
                            />
                            <FiPercent className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                        </div>
                    </label>
                    <label className="block space-y-2">
                        <span className="label-text">Reason or note</span>
                        <textarea
                            name="discountNote"
                            defaultValue={discountItem?.description ?? ""}
                            rows={2}
                            className="input-field min-h-20 resize-y leading-relaxed"
                            placeholder="Optional"
                        />
                    </label>

                    <div className="space-y-2 rounded-2xl border border-border/60 bg-background p-4">
                        <SummaryRow label="Current subtotal" value={formatMoney(subtotalBeforeDiscount)} />
                        <SummaryRow label="Discount" value={`${numericPercentage}%`} />
                        <SummaryRow label="Discount amount" value={`-${formatMoney(discountAmount)}`} />
                        <SummaryRow label="Updated total" value={formatMoney(updatedTotal)} emphasized />
                        <SummaryRow label="Amount due" value={formatMoney(amountDue)} emphasized />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary inline-flex w-full items-center justify-center gap-2"
                        disabled={pending || subtotalBeforeDiscount <= 0}
                    >
                        <FiSave aria-hidden="true" /> {pending ? "Saving..." : "Save discount"}
                    </button>
                </form>
            )}
        </section>
    );
}
