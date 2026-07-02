import type { BookingSelections, ServiceConfig, ServiceOption } from "@/features/bookings/new-booking/types";
import {
    getRemovalOption,
    getService,
    getServiceOption,
    isRemovalOnly,
    requiresDesignTier,
} from "@/features/bookings/new-booking/utils";
import type { Database } from "@/types/supabase";

type BookingLineItemInsert =
    Database["public"]["Tables"]["booking_line_items"]["Insert"];

export type BookingLineItemDraft = Required<
    Pick<
        BookingLineItemInsert,
        | "item_type"
        | "label_snapshot"
        | "description_snapshot"
        | "quantity"
        | "unit_price"
        | "active"
    >
> &
    Pick<
        BookingLineItemInsert,
        "source_table" | "source_id"
    >;

type DesignTierSource = {
    id: string;
    name: string;
    description: string | null;
    price: number;
};

function normalizeDesignTierLabel(label: string) {
    if (/^design tier/i.test(label)) return label;
    if (/^tier\s+/i.test(label)) return `Design ${label}`;
    return label;
}

export function buildServiceLineItemLabel(
    service: ServiceConfig,
    serviceOption: ServiceOption,
) {
    if (service.id === "freestyle") return service.label;

    const optionLabel =
        serviceOption.groupLabel && service.id === "structured_gel_manicure"
            ? `${serviceOption.groupLabel} ${serviceOption.label}`
            : serviceOption.label;

    return `${service.label} • ${optionLabel}`;
}

export function buildBookingServiceLineItems({
    selections,
    designTier,
}: {
    selections: BookingSelections;
    designTier: DesignTierSource | null;
}): BookingLineItemDraft[] | null {
    const removal = getRemovalOption(selections.removalId);
    const service = getService(selections.serviceId);
    const serviceOption = getServiceOption(service, selections.serviceOptionId);

    if (!removal) return null;
    if (
        !isRemovalOnly(selections.removalId) &&
        (!service ||
            !serviceOption ||
            (requiresDesignTier(service) && !designTier))
    ) {
        return null;
    }

    const lineItems: BookingLineItemDraft[] = [];

    if (removal.price > 0) {
        lineItems.push({
            item_type: "removal",
            label_snapshot: removal.label,
            description_snapshot: removal.description,
            quantity: 1,
            unit_price: removal.price,
            active: true,
        });
    }

    if (!isRemovalOnly(selections.removalId) && service && serviceOption) {
        lineItems.push({
            item_type: "service",
            label_snapshot: buildServiceLineItemLabel(service, serviceOption),
            description_snapshot:
                serviceOption.helperText ?? service.description,
            quantity: 1,
            unit_price: serviceOption.price,
            active: true,
        });
    }

    if (
        !isRemovalOnly(selections.removalId) &&
        requiresDesignTier(service) &&
        designTier
    ) {
        lineItems.push({
            item_type: "design_tier",
            source_table: "design_tiers",
            source_id: designTier.id,
            label_snapshot: normalizeDesignTierLabel(designTier.name),
            description_snapshot: designTier.description,
            quantity: 1,
            unit_price: Number(designTier.price),
            active: true,
        });
    }

    return lineItems;
}
