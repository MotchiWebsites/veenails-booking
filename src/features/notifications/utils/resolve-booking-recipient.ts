import "server-only";

type ContactMethod = "email" | "instagram";

type BookingContactSource = {
    client_display_name?: string | null;
    client_email?: string | null;
    client_instagram_handle?: string | null;
    client_preferred_contact_method?: string | null;
    profiles?: {
        display_name?: string | null;
        email?: string | null;
        instagram_handle?: string | null;
        preferred_contact_method?: string | null;
    } | null;
};

export type BookingRecipient = {
    email: string | null;
    instagramHandle: string | null;
    preferredContactMethod: ContactMethod | null;
    displayName: string | null;
};

function clean(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized || null;
}

export function resolveBookingRecipient(
    booking: BookingContactSource,
): BookingRecipient {
    const email = clean(booking.profiles?.email) ?? clean(booking.client_email);
    const instagramHandle =
        clean(booking.profiles?.instagram_handle) ??
        clean(booking.client_instagram_handle);
    const storedPreference =
        booking.profiles?.preferred_contact_method ??
        booking.client_preferred_contact_method;

    let preferredContactMethod: ContactMethod | null = null;
    if (storedPreference === "email" && email) {
        preferredContactMethod = "email";
    } else if (storedPreference === "instagram" && instagramHandle) {
        preferredContactMethod = "instagram";
    } else if (email) {
        preferredContactMethod = "email";
    } else if (instagramHandle) {
        preferredContactMethod = "instagram";
    }

    return {
        email,
        instagramHandle,
        preferredContactMethod,
        displayName:
            clean(booking.profiles?.display_name) ??
            clean(booking.client_display_name),
    };
}
