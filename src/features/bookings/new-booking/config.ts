import type { RemovalOption, ServiceConfig } from "@/features/bookings/new-booking/types";

export const bookingSteps = [
    { id: "time", label: "Time" },
    { id: "removal", label: "Removal" },
    { id: "service", label: "Service" },
    { id: "design", label: "Design" },
    { id: "review", label: "Review" },
] as const;

export const removalOptions = [
    {
        id: "none",
        label: "No removal",
        description: "Start with a fresh service and no existing set removal.",
        price: 0,
        summaryLabel: "No removal",
    },
    {
        id: "with_new_set",
        label: "Removal with New Set",
        description: "Add removal to a new appointment for an extra $10.",
        price: 10,
        summaryLabel: "Removal with New Set",
    },
    {
        id: "removal_only",
        label: "Removal Only",
        description: "Book removal by itself for $20 and skip service selection.",
        price: 20,
        summaryLabel: "Removal Only",
    },
] as const satisfies readonly RemovalOption[];

export const services = [
    {
        id: "apres_gel_x",
        label: "Apres Gel-X",
        description: "Choose your set length to match the current pricing menu.",
        options: [
            { id: "short", label: "Short", price: 70 },
            { id: "medium", label: "Medium", price: 75 },
            { id: "long", label: "Long", price: 80 },
            { id: "extra_long", label: "Extra Long", price: 85 },
        ],
    },
    {
        id: "structured_gel_manicure",
        label: "Structured Gel Manicure",
        description:
            "Pick the length and appointment type that best matches your visit.",
        options: [
            {
                id: "short_base",
                label: "Base",
                groupId: "short",
                groupLabel: "Short",
                price: 65,
            },
            {
                id: "short_infill",
                label: "Infill",
                groupId: "short",
                groupLabel: "Short",
                price: 60,
            },
            {
                id: "short_rebalance",
                label: "Rebalance",
                groupId: "short",
                groupLabel: "Short",
                helperText: "After 4 weeks",
                price: 70,
            },
            {
                id: "medium_long_base",
                label: "Base",
                groupId: "medium_long",
                groupLabel: "Medium / Long",
                price: 70,
            },
            {
                id: "medium_long_infill",
                label: "Infill",
                groupId: "medium_long",
                groupLabel: "Medium / Long",
                price: 65,
            },
            {
                id: "medium_long_rebalance",
                label: "Rebalance",
                groupId: "medium_long",
                groupLabel: "Medium / Long",
                price: 75,
            },
        ],
    },
    {
        id: "freestyle",
        label: "Freestyle",
        description: "One signature freestyle option at the current base price.",
        options: [{ id: "freestyle", label: "Freestyle", price: 85 }],
    },
] as const satisfies readonly ServiceConfig[];
