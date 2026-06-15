"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";

import AppSelect from "@/components/shared/form/AppSelect";
import { useToast } from "@/components/shared/toast/ToastProvider";
import { updateBookingServices } from "@/features/bookings/actions/bookings";
import type { BookingDetailsData } from "@/features/bookings/details/data/booking-details";
import { removalOptions, services } from "@/features/bookings/new-booking/config";
import type {
    BookingSelections,
    DesignTier,
    ServiceConfig,
    ServiceOption,
} from "@/features/bookings/new-booking/types";
import {
    buildServiceOptionLabel,
    calculateEstimate,
    getDesignTier,
    getRemovalOption,
    getService,
    getServiceOption,
    getServiceOptionGroups,
    isRemovalOnly,
} from "@/features/bookings/new-booking/utils";
import type { BookingEditActionState } from "@/features/bookings/types/bookings";
import { formatMoney } from "@/features/bookings/utils/booking-formatters";

const initialState: BookingEditActionState = {
    error: "",
    success: "",
    messageId: "",
};

function buildServiceLineItemLabel(
    service: ServiceConfig,
    serviceOption: ServiceOption,
) {
    if (service.id === "freestyle") {
        return service.label;
    }

    const optionLabel =
        serviceOption.groupLabel && service.id === "structured_gel_manicure"
            ? `${serviceOption.groupLabel} ${serviceOption.label}`
            : serviceOption.label;

    return `${service.label} • ${optionLabel}`;
}

function inferSelections(data: BookingDetailsData): BookingSelections {
    const removalItem = data.summary.lineItems.find(
        (item) => item.itemType === "removal",
    );
    const serviceItem = data.summary.lineItems.find(
        (item) => item.itemType === "service",
    );
    const designItem = data.summary.lineItems.find(
        (item) => item.itemType === "design_tier",
    );

    const removal =
        removalOptions.find((option) => option.label === removalItem?.label) ??
        removalOptions.find((option) => option.id === "none") ??
        null;

    let service: ServiceConfig | null = null;
    let serviceOption: ServiceOption | null = null;

    if (serviceItem) {
        for (const candidateService of services) {
            const option = candidateService.options.find(
                (candidateOption) =>
                    buildServiceLineItemLabel(
                        candidateService,
                        candidateOption,
                    ) === serviceItem.label ||
                    (candidateOption.price === serviceItem.unitPrice &&
                        serviceItem.label.includes(candidateService.label) &&
                        serviceItem.label.includes(candidateOption.label)),
            );

            if (option) {
                service = candidateService;
                serviceOption = option;
                break;
            }
        }
    }

    return {
        slotId: null,
        removalId: removal?.id ?? "none",
        serviceId: service?.id ?? null,
        serviceOptionGroupId: serviceOption?.groupId ?? null,
        serviceOptionId: serviceOption?.id ?? null,
        designTierId: designItem?.sourceId ?? null,
    };
}

function canSaveServiceSelections({
    selections,
    service,
    serviceOption,
    serviceOptionGroups,
    designTier,
}: {
    selections: BookingSelections;
    service: ServiceConfig | null;
    serviceOption: ServiceOption | null;
    serviceOptionGroups: ReturnType<typeof getServiceOptionGroups>;
    designTier: DesignTier | null;
}) {
    if (!selections.removalId) {
        return false;
    }

    if (isRemovalOnly(selections.removalId)) {
        return true;
    }

    if (!service || !serviceOption || !designTier) {
        return false;
    }

    if (
        serviceOptionGroups.length > 0 &&
        !selections.serviceOptionGroupId
    ) {
        return false;
    }

    return (
        !serviceOption.groupId ||
        serviceOption.groupId === selections.serviceOptionGroupId
    );
}

function comparableSelections(selections: BookingSelections) {
    const removalOnly = isRemovalOnly(selections.removalId);

    return {
        removalId: selections.removalId ?? null,
        serviceId: removalOnly ? null : (selections.serviceId ?? null),
        serviceOptionGroupId: removalOnly
            ? null
            : (selections.serviceOptionGroupId ?? null),
        serviceOptionId: removalOnly
            ? null
            : (selections.serviceOptionId ?? null),
        designTierId: removalOnly ? null : (selections.designTierId ?? null),
    };
}

function haveServiceSelectionsChanged(
    current: BookingSelections,
    initial: BookingSelections,
) {
    const currentComparable = comparableSelections(current);
    const initialComparable = comparableSelections(initial);

    return (
        currentComparable.removalId !== initialComparable.removalId ||
        currentComparable.serviceId !== initialComparable.serviceId ||
        currentComparable.serviceOptionGroupId !==
            initialComparable.serviceOptionGroupId ||
        currentComparable.serviceOptionId !==
            initialComparable.serviceOptionId ||
        currentComparable.designTierId !== initialComparable.designTierId
    );
}

export default function EditServicesForm({
    data,
    designTiers,
    canEdit,
}: {
    data: BookingDetailsData;
    designTiers: DesignTier[];
    canEdit: boolean;
}) {
    const router = useRouter();
    const { error, success } = useToast();
    const initialSelections = useMemo(() => inferSelections(data), [data]);
    const [selections, setSelections] =
        useState<BookingSelections>(initialSelections);
    const [state, formAction, pending] = useActionState(
        updateBookingServices,
        initialState,
    );

    useEffect(() => {
        if (!state.messageId) return;

        if (state.error) {
            error(state.error, "Service update failed");
            return;
        }

        if (state.success) {
            success(state.success, "Service changes saved");
            router.refresh();
        }
    }, [error, router, state.error, state.messageId, state.success, success]);

    const selectedRemoval = getRemovalOption(selections.removalId);
    const selectedService = getService(selections.serviceId);
    const serviceOptionGroups = getServiceOptionGroups(selectedService);
    const selectedServiceOption = getServiceOption(
        selectedService,
        selections.serviceOptionId,
    );
    const serviceOptions = selectedService
        ? (selectedService.options as readonly ServiceOption[])
        : [];
    const selectedDesignTier = getDesignTier(
        selections.designTierId,
        designTiers,
    );
    const estimate = calculateEstimate(
        selections,
        {
            depositAmount: data.depositAmount,
            bookingFeeMode: data.bookingFeeMode,
            bookingFeeRate: data.bookingFeeRate,
            holdMinutes: 0,
        },
        designTiers,
    );
    const fullService = !isRemovalOnly(selections.removalId);
    const hasChanges = haveServiceSelectionsChanged(
        selections,
        initialSelections,
    );
    const canSave =
        canEdit &&
        hasChanges &&
        canSaveServiceSelections({
            selections,
            service: selectedService,
            serviceOption: selectedServiceOption,
            serviceOptionGroups,
            designTier: selectedDesignTier,
        });

    function setSelection(next: Partial<BookingSelections>) {
        setSelections((current) => ({ ...current, ...next }));
    }

    return (
        <form action={formAction} className="space-y-5">
            <input type="hidden" name="bookingId" value={data.summary.id} />
            <input
                type="hidden"
                name="removalId"
                value={selections.removalId ?? ""}
            />
            <input
                type="hidden"
                name="serviceId"
                value={fullService ? (selections.serviceId ?? "") : ""}
            />
            <input
                type="hidden"
                name="serviceOptionGroupId"
                value={fullService ? (selections.serviceOptionGroupId ?? "") : ""}
            />
            <input
                type="hidden"
                name="serviceOptionId"
                value={fullService ? (selections.serviceOptionId ?? "") : ""}
            />
            <input
                type="hidden"
                name="designTierId"
                value={fullService ? (selections.designTierId ?? "") : ""}
            />

            <div className="grid gap-4 xl:grid-cols-2">
                <AppSelect
                    label="Removal option"
                    value={selections.removalId ?? ""}
                    onChange={(removalId) => {
                        setSelection({
                            removalId:
                                removalId as BookingSelections["removalId"],
                            serviceId:
                                removalId === "removal_only"
                                    ? null
                                    : selections.serviceId,
                            serviceOptionGroupId:
                                removalId === "removal_only"
                                    ? null
                                    : selections.serviceOptionGroupId,
                            serviceOptionId:
                                removalId === "removal_only"
                                    ? null
                                    : selections.serviceOptionId,
                            designTierId:
                                removalId === "removal_only"
                                    ? null
                                    : selections.designTierId,
                        });
                    }}
                    disabled={!canEdit || pending}
                    options={removalOptions.map((option) => ({
                        value: option.id,
                        label: `${option.summaryLabel} · ${formatMoney(
                            option.price,
                        )}`,
                    }))}
                />

                {fullService ? (
                    <AppSelect
                        label="Service"
                        value={selections.serviceId ?? ""}
                        onChange={(serviceId) => {
                            setSelection({
                                serviceId:
                                    serviceId as BookingSelections["serviceId"],
                                serviceOptionGroupId: null,
                                serviceOptionId: null,
                                designTierId: null,
                            });
                        }}
                        disabled={!canEdit || pending}
                        placeholder="Choose service"
                        options={services.map((service) => ({
                            value: service.id,
                            label: service.label,
                        }))}
                    />
                ) : null}

                {fullService && serviceOptionGroups.length > 0 ? (
                    <AppSelect
                        label="Length"
                        value={selections.serviceOptionGroupId ?? ""}
                        onChange={(groupId) => {
                            setSelection({
                                serviceOptionGroupId: groupId,
                                serviceOptionId: null,
                            });
                        }}
                        disabled={!canEdit || pending}
                        placeholder="Choose length"
                        options={serviceOptionGroups.map((group) => ({
                            value: group.id,
                            label: group.label,
                        }))}
                    />
                ) : null}

                {fullService && selectedService ? (
                    <AppSelect
                        label="Service option"
                        value={selections.serviceOptionId ?? ""}
                        onChange={(serviceOptionId) => {
                            const option =
                                serviceOptions.find(
                                    (item) => item.id === serviceOptionId,
                                ) ?? null;

                            setSelection({
                                serviceOptionId,
                                serviceOptionGroupId:
                                    option?.groupId ??
                                    selections.serviceOptionGroupId,
                            });
                        }}
                        disabled={!canEdit || pending}
                        placeholder="Choose option"
                        options={serviceOptions
                            .filter(
                                (option) =>
                                    !option.groupId ||
                                    !selections.serviceOptionGroupId ||
                                    option.groupId ===
                                        selections.serviceOptionGroupId,
                            )
                            .map((option) => ({
                                value: option.id,
                                label: `${buildServiceOptionLabel(
                                    selectedService,
                                    option,
                                )} · ${formatMoney(option.price)}`,
                            }))}
                    />
                ) : null}

                {fullService ? (
                    <AppSelect
                        label="Design tier"
                        value={selections.designTierId ?? ""}
                        onChange={(designTierId) =>
                            setSelection({ designTierId })
                        }
                        disabled={!canEdit || pending}
                        placeholder="Choose design tier"
                        options={designTiers.map((tier) => ({
                            value: tier.id,
                            label: `${tier.label} · ${formatMoney(tier.price)}`,
                        }))}
                    />
                ) : null}
            </div>

            <div className="rounded-2xl bg-background p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <p className="text-sm text-muted">
                        Removal
                        <span className="mt-1 block font-semibold text-foreground">
                            {selectedRemoval?.summaryLabel ?? "Not selected"}
                        </span>
                    </p>
                    <p className="text-sm text-muted">
                        Service
                        <span className="mt-1 block font-semibold text-foreground">
                            {fullService
                                ? (selectedService?.label ?? "Not selected")
                                : "Removal only"}
                        </span>
                    </p>
                    <p className="text-sm text-muted">
                        Option
                        <span className="mt-1 block font-semibold text-foreground">
                            {fullService
                                ? (buildServiceOptionLabel(
                                      selectedService,
                                      selectedServiceOption,
                                  ) ?? "Not selected")
                                : "Not needed"}
                        </span>
                    </p>
                    <p className="text-sm text-muted">
                        Design
                        <span className="mt-1 block font-semibold text-foreground">
                            {fullService
                                ? (selectedDesignTier?.label ?? "Not selected")
                                : "Not needed"}
                        </span>
                    </p>
                </div>
                <div className="mt-4 border-t border-border/60 pt-4">
                    <p className="text-sm text-muted">
                        Estimated total
                        <span className="ml-2 text-lg font-semibold text-foreground">
                            {formatMoney(estimate.total)}
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {!hasChanges ? (
                    <p className="text-sm text-muted sm:mr-auto">
                        Make a service change to save updates.
                    </p>
                ) : null}
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={!canSave || pending}
                >
                    <FiSave className="h-4 w-4" aria-hidden="true" />
                    {pending ? "Saving..." : "Save service changes"}
                </button>
            </div>
        </form>
    );
}
