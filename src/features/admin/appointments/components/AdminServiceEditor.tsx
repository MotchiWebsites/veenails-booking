"use client";

import { useMemo, useState } from "react";
import { FiSave, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import AppSelect from "@/components/shared/form/AppSelect";
import { updateAppointmentServicesAction } from "@/features/admin/appointments/actions/admin-appointments";
import type { AdminAppointmentDetails } from "@/features/admin/appointments/data/admin-appointments";
import { inferAdminServiceSelections } from "@/features/admin/appointments/utils/admin-service-selections";
import { formatMoney } from "@/features/admin/components/admin-formatters";
import { removalOptions, services } from "@/features/bookings/new-booking/config";
import type { BookingSelections, DesignTier, ServiceOption } from "@/features/bookings/new-booking/types";
import { buildServiceOptionLabel, calculateEstimate, getService, getServiceOption, getServiceOptionGroups, isRemovalOnly } from "@/features/bookings/new-booking/utils";

function comparable(selections: BookingSelections) {
    const removalOnly = isRemovalOnly(selections.removalId);
    return JSON.stringify({
        removalId: selections.removalId,
        serviceId: removalOnly ? null : selections.serviceId,
        serviceOptionGroupId: removalOnly ? null : selections.serviceOptionGroupId,
        serviceOptionId: removalOnly ? null : selections.serviceOptionId,
        designTierId: removalOnly ? null : selections.designTierId,
    });
}

export default function AdminServiceEditor({ booking }: { booking: AdminAppointmentDetails }) {
    const inferred = useMemo(() => inferAdminServiceSelections(booking), [booking]);
    const initialSelections = inferred.selections;
    const [selections, setSelections] = useState(initialSelections);
    const designTiers: DesignTier[] = booking.designTiers.map((tier) => ({
        id: tier.id,
        label: tier.name,
        price: tier.price,
        imageSrc: null,
        imageAlt: tier.name,
    }));
    const selectedService = getService(selections.serviceId);
    const selectedOption = getServiceOption(selectedService, selections.serviceOptionId);
    const optionGroups = getServiceOptionGroups(selectedService);
    const fullService = !isRemovalOnly(selections.removalId);
    const estimate = calculateEstimate(
        selections,
        {
            depositAmount: booking.depositAmount,
            bookingFeeMode: booking.bookingFeeMode,
            bookingFeeRate: booking.bookingFeeRate,
            holdMinutes: 0,
        },
        designTiers,
    );
    const currentTotal = booking.finalTotal > 0 ? booking.finalTotal : booking.estimatedTotal;
    const difference = Math.round((estimate.total - currentTotal) * 100) / 100;
    const hasChanges = comparable(selections) !== comparable(initialSelections);
    const canSave = Boolean(
        inferred.reliable &&
            hasChanges &&
            selections.removalId &&
            (isRemovalOnly(selections.removalId) || (selectedService && selectedOption)),
    );

    function update(next: Partial<BookingSelections>) {
        setSelections((current) => ({ ...current, ...next }));
    }

    return (
        <section className="overflow-hidden rounded-3xl border border-dark-green/20 bg-surface shadow-sm">
            <div className="grid gap-4 bg-surface-2 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-green">
                        Services & price
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">
                        What the client booked
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {booking.lineItems.length ? booking.lineItems.map((item) => (
                            <span key={item.id} className="rounded-full border border-border/60 bg-surface px-3 py-1.5 text-sm font-medium text-foreground">
                                {item.label}
                            </span>
                        )) : <span className="text-sm text-muted">No active services</span>}
                    </div>
                </div>
                <div className="rounded-2xl bg-dark-green px-5 py-4 text-white xl:min-w-52 xl:text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Amount to charge</p>
                    <p className="mt-1 text-3xl font-semibold">{formatMoney(booking.amountDue)}</p>
                    <p className="mt-1 text-xs text-white/70">Appointment total {formatMoney(currentTotal)}</p>
                </div>
            </div>

            <form action={updateAppointmentServicesAction} className="p-5 sm:p-7">
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="removalId" value={selections.removalId ?? ""} />
                <input type="hidden" name="serviceId" value={fullService ? selections.serviceId ?? "" : ""} />
                <input type="hidden" name="serviceOptionId" value={fullService ? selections.serviceOptionId ?? "" : ""} />
                <input type="hidden" name="designTierId" value={fullService ? selections.designTierId ?? "" : ""} />

                <div className="mb-5">
                    <h3 className="font-semibold text-foreground">Edit services</h3>
                    <p className="mt-1 text-sm text-muted">Review the live price below before saving.</p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <AppSelect
                        label="Removal option"
                        value={selections.removalId ?? ""}
                        onChange={(removalId) => update({
                            removalId: removalId as BookingSelections["removalId"],
                            ...(removalId === "removal_only" ? { serviceId: null, serviceOptionGroupId: null, serviceOptionId: null, designTierId: null } : {}),
                        })}
                        placeholder="Choose removal option"
                        options={removalOptions.map((option) => ({ value: option.id, label: `${option.summaryLabel} · ${formatMoney(option.price)}` }))}
                    />

                    <AppSelect
                        label="Service"
                        value={fullService ? selections.serviceId ?? "" : ""}
                        onChange={(serviceId) => update({ serviceId: serviceId as BookingSelections["serviceId"], serviceOptionGroupId: null, serviceOptionId: null })}
                        disabled={!fullService}
                        placeholder={fullService ? "No service selected" : "No service / removal only"}
                        options={services.map((service) => ({ value: service.id, label: service.label }))}
                    />

                    {fullService && optionGroups.length > 0 ? (
                        <AppSelect
                            label="Length"
                            value={selections.serviceOptionGroupId ?? ""}
                            onChange={(groupId) => update({ serviceOptionGroupId: groupId, serviceOptionId: null })}
                            placeholder="Choose length"
                            options={optionGroups.map((group) => ({ value: group.id, label: group.label }))}
                        />
                    ) : null}

                    <AppSelect
                        label="Service option"
                        value={fullService ? selections.serviceOptionId ?? "" : ""}
                        onChange={(optionId) => {
                            const option = selectedService?.options.find((item) => item.id === optionId) as ServiceOption | undefined;
                            update({ serviceOptionId: optionId, serviceOptionGroupId: option?.groupId ?? selections.serviceOptionGroupId });
                        }}
                        disabled={!fullService || !selectedService}
                        placeholder={fullService ? "No option selected" : "Not needed for removal only"}
                        options={((selectedService?.options ?? []) as readonly ServiceOption[]).filter((option) => !option.groupId || !selections.serviceOptionGroupId || option.groupId === selections.serviceOptionGroupId).map((option) => ({ value: option.id, label: `${buildServiceOptionLabel(selectedService, option)} · ${formatMoney(option.price)}` }))}
                    />

                    <AppSelect
                        label="Design tier (optional)"
                        value={fullService ? selections.designTierId ?? "" : ""}
                        onChange={(designTierId) => update({ designTierId: designTierId || null })}
                        disabled={!fullService}
                        placeholder={fullService ? "No design add-on" : "Not needed for removal only"}
                        options={designTiers.map((tier) => ({ value: tier.id, label: `${tier.label} · ${formatMoney(tier.price)}` }))}
                    />
                </div>

                {!inferred.reliable ? (
                    <p className="mt-4 rounded-2xl border border-border/60 bg-background p-4 text-sm text-muted">
                        The saved service labels could not be matched safely. The existing booking will remain unchanged until its selections can be confirmed.
                    </p>
                ) : null}

                <div className="mt-6 grid gap-3 rounded-2xl border border-border/60 bg-background p-4 sm:grid-cols-3 sm:p-5">
                    <Price label="Current total" value={currentTotal} />
                    <Price label="Updated total" value={estimate.total} emphasized />
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Difference</p>
                        <p className={`mt-2 flex items-center gap-1 text-lg font-semibold ${difference > 0 ? "text-dark-green" : difference < 0 ? "text-foreground" : "text-muted"}`}>
                            {difference > 0 ? <FiTrendingUp aria-hidden="true" /> : difference < 0 ? <FiTrendingDown aria-hidden="true" /> : null}
                            {difference > 0 ? "+" : ""}{formatMoney(difference)}
                        </p>
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted">{hasChanges ? "Changes are only applied after you save." : "Current selections are loaded from this booking."}</p>
                    <button type="submit" className="btn-primary inline-flex items-center justify-center gap-2" disabled={!canSave}>
                        <FiSave aria-hidden="true" /> Save service changes
                    </button>
                </div>
            </form>
        </section>
    );
}

function Price({ label, value, emphasized = false }: { label: string; value: number; emphasized?: boolean }) {
    return <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p><p className={`mt-2 font-semibold text-foreground ${emphasized ? "text-2xl" : "text-lg"}`}>{formatMoney(value)}</p></div>;
}
