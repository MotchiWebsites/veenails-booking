export type LandingSettings = {
    depositAmount: number;
    bookingFeeRate: number;
    bookingFeeMode: "added_on_top" | "included_in_price";
    holdMinutes: number;
    etransferEmail: string | null;
    instagramUrl: string | null;
};

export type LandingPricingCard = {
    id: string;
    title: string;
    description: string;
    priceLabel: string;
};

export type LandingPolicy = {
    id: string;
    title: string;
    description: string;
};

export type LandingData = {
    settings: LandingSettings;
    pricingCards: LandingPricingCard[];
    policies: LandingPolicy[];
};
