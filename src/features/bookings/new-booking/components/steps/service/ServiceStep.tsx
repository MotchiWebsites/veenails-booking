"use client";

import { useEffect, useRef } from "react";
import { services } from "@/features/bookings/new-booking/config";
import type {
    BookingEstimate,
    BookingSelections,
    ServiceConfig,
    ServiceOption,
} from "@/features/bookings/new-booking/types";

import ServiceOptionButton from "@/features/bookings/new-booking/components/steps/service/ServiceOptionButton";

type ServiceOptionGroup = {
    id: string;
    label: string;
};

type ServiceStepProps = {
    selectedServiceId: BookingSelections["serviceId"];
    selectedServiceOptionId: BookingSelections["serviceOptionId"];
    selectedServiceOptionGroupId: string | null;
    estimate: BookingEstimate;
    serviceOptionGroups: ServiceOptionGroup[];
    visibleServiceOptions: readonly ServiceOption[];
    onSelectService: (serviceId: ServiceConfig["id"]) => void;
    onSelectServiceOptionGroup: (groupId: string) => void;
    onSelectServiceOption: (optionId: ServiceOption["id"]) => void;
};

export default function ServiceStep({
    selectedServiceId,
    selectedServiceOptionId,
    selectedServiceOptionGroupId,
    estimate,
    serviceOptionGroups,
    visibleServiceOptions,
    onSelectService,
    onSelectServiceOptionGroup,
    onSelectServiceOption,
}: ServiceStepProps) {
    const optionsPanelRef = useRef<HTMLDivElement | null>(null);
    const shouldScrollToOptionsRef = useRef(false);
    const selectedEstimateServiceId = estimate.service?.id ?? null;

    useEffect(() => {
        if (!selectedEstimateServiceId || !shouldScrollToOptionsRef.current) {
            return;
        }

        shouldScrollToOptionsRef.current = false;

        window.requestAnimationFrame(() => {
            optionsPanelRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        });
    }, [selectedEstimateServiceId]);

    function handleServiceClick(serviceId: ServiceConfig["id"]) {
        shouldScrollToOptionsRef.current = true;
        onSelectService(serviceId);

        if (selectedServiceId === serviceId) {
            window.requestAnimationFrame(() => {
                optionsPanelRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                });
            });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Select your service
                </h2>
                <p className="text-sm leading-relaxed text-muted sm:text-base">
                    Pick a service first, then choose the exact option and price
                    for this appointment.
                </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
                {services.map((service) => {
                    const selected = selectedServiceId === service.id;

                    return (
                        <button
                            key={service.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => handleServiceClick(service.id)}
                            className={[
                                "clickable rounded-3xl border p-5 text-left shadow-sm transition-all duration-200",
                                selected
                                    ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                    : "border-border/60 bg-background hover:border-pink-200 hover:bg-pink-50/70",
                            ].join(" ")}
                        >
                            <h3 className="text-base font-semibold text-foreground">
                                {service.label}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                {service.description}
                            </p>
                        </button>
                    );
                })}
            </div>

            {estimate.service ? (
                <div
                    ref={optionsPanelRef}
                    className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm"
                >
                    <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-semibold text-dark-green">
                            {estimate.service.label} options
                        </h3>
                        <p className="text-sm text-muted">
                            Choose one base-price option to continue.
                        </p>
                    </div>

                    {estimate.service.id === "structured_gel_manicure" ? (
                        <div className="mt-4 space-y-4">
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                                    1. Choose length
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {serviceOptionGroups.map((group) => {
                                        const selected =
                                            selectedServiceOptionGroupId ===
                                            group.id;

                                        return (
                                            <button
                                                key={group.id}
                                                type="button"
                                                aria-pressed={selected}
                                                onClick={() =>
                                                    onSelectServiceOptionGroup(
                                                        group.id,
                                                    )
                                                }
                                                className={[
                                                    "clickable flex min-h-20 items-center rounded-3xl border p-4 text-left shadow-sm transition-all duration-200",
                                                    selected
                                                        ? "border-pink-300 bg-pink-50 ring-2 ring-ring"
                                                        : "border-border/60 bg-surface hover:border-pink-200 hover:bg-pink-50/70",
                                                ].join(" ")}
                                            >
                                                <h4 className="text-base font-semibold leading-tight text-foreground">
                                                    {group.label}
                                                </h4>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                                    2. Choose appointment type
                                </p>
                                {selectedServiceOptionGroupId ? (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {visibleServiceOptions.map((option) => (
                                            <ServiceOptionButton
                                                key={option.id}
                                                option={option}
                                                selected={
                                                    selectedServiceOptionId ===
                                                    option.id
                                                }
                                                onSelect={onSelectServiceOption}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-3xl border border-dashed border-border bg-surface px-4 py-5 text-sm text-muted">
                                        Pick a length first to see the matching
                                        appointment types.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {visibleServiceOptions.map((option) => (
                                <ServiceOptionButton
                                    key={option.id}
                                    option={option}
                                    selected={
                                        selectedServiceOptionId === option.id
                                    }
                                    onSelect={onSelectServiceOption}
                                    showGroupLabel
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
