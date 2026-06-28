import { removalOptions, services } from "@/features/bookings/new-booking/config";
import { requiresDesignTier } from "@/features/bookings/new-booking/utils";
import type { BookingSelections, ServiceConfig, ServiceOption } from "@/features/bookings/new-booking/types";
import type { AdminAppointmentDetails, AdminLineItem } from "@/features/admin/appointments/data/admin-appointments";

export function buildStoredServiceLabel(
    service: ServiceConfig,
    option: ServiceOption,
) {
    if (service.id === "freestyle") return service.label;

    const optionLabel =
        option.groupLabel && service.id === "structured_gel_manicure"
            ? `${option.groupLabel} ${option.label}`
            : option.label;

    return `${service.label} • ${optionLabel}`;
}

function inferService(item: AdminLineItem | undefined) {
    if (!item) return null;

    if (item.sourceTable === "booking_config" && item.sourceId) {
        const [serviceId, optionId] = item.sourceId.split(":");
        const service = services.find((candidate) => candidate.id === serviceId);
        const option = service?.options.find(
            (candidate) => candidate.id === optionId,
        ) as ServiceOption | undefined;

        if (service && option) return { service, option };
    }

    for (const service of services) {
        const option = service.options.find(
            (candidate) => buildStoredServiceLabel(service, candidate) === item.label,
        ) as ServiceOption | undefined;
        if (option) return { service, option };
    }

    return null;
}

export function inferAdminServiceSelections(
    booking: AdminAppointmentDetails,
): { selections: BookingSelections; reliable: boolean } {
    const removalItem = booking.lineItems.find((item) => item.itemType === "removal");
    const serviceItem = booking.lineItems.find((item) => item.itemType === "service");
    const designItem = booking.lineItems.find((item) => item.itemType === "design_tier");
    const removal = removalItem
        ? removalOptions.find((option) => option.label === removalItem.label) ?? null
        : removalOptions.find((option) => option.id === "none") ?? null;
    const inferredService = inferService(serviceItem);
    const designTier = designItem
        ? booking.designTiers.find(
              (tier) =>
                  tier.id === designItem.sourceId || tier.name === designItem.label,
          ) ?? null
        : null;
    const removalOnly = removal?.id === "removal_only";
    const designTierRequired = requiresDesignTier(inferredService?.service);
    const reliable = Boolean(
        removal &&
            (removalOnly || (!serviceItem || inferredService)) &&
            (!designTierRequired || !designItem || designTier),
    );

    return {
        reliable,
        selections: {
            slotId: booking.slotId,
            removalId: removal?.id ?? null,
            serviceId: removalOnly ? null : inferredService?.service.id ?? null,
            serviceOptionGroupId: removalOnly
                ? null
                : inferredService?.option.groupId ?? null,
            serviceOptionId: removalOnly ? null : inferredService?.option.id ?? null,
            designTierId:
                removalOnly || !designTierRequired
                    ? null
                    : designTier?.id ?? null,
        },
    };
}
