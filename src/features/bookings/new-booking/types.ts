import type { Database } from "@/types/supabase";

export type NewBookingStep =
    | "time"
    | "removal"
    | "service"
    | "design"
    | "review";

export type BookingFeeMode = Database["public"]["Enums"]["fee_mode"];

export type AvailableAppointmentSlot = {
    id: string;
    startsAt: string;
    endsAt: string;
};

export type BookingSettingsSummary = {
    depositAmount: number;
    bookingFeeMode: BookingFeeMode;
    bookingFeeRate: number;
    holdMinutes: number;
} | null;

export type RemovalOption = {
    id: "none" | "with_new_set" | "removal_only";
    label: string;
    description: string;
    price: number;
    summaryLabel: string;
};

export type ServiceOption = {
    id: string;
    label: string;
    price: number;
    groupId?: string;
    groupLabel?: string;
    helperText?: string;
};

export type ServiceConfig = {
    id: "apres_gel_x" | "structured_gel_manicure" | "freestyle";
    label: string;
    description: string;
    options: readonly ServiceOption[];
};

export type DesignTier = {
    id: string;
    label: string;
    description?: string;
    price: number;
    imageSrc: string | null;
    imageAlt: string;
};

export type BookingSelections = {
    slotId: string | null;
    removalId: RemovalOption["id"] | null;
    serviceId: ServiceConfig["id"] | null;
    serviceOptionGroupId: string | null;
    serviceOptionId: string | null;
    designTierId: DesignTier["id"] | null;
};

export type BookingEstimate = {
    subtotal: number;
    bookingFee: number;
    bookingFeeIncluded: boolean;
    total: number;
    removal: RemovalOption | null;
    service: ServiceConfig | null;
    serviceOption: ServiceOption | null;
    designTier: DesignTier | null;
};
