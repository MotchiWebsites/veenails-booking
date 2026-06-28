import "server-only";

function clean(value: string | undefined) {
    const normalized = value?.trim();
    return normalized || null;
}

export function getEmailConfig() {
    return {
        apiKey: clean(process.env.BREVO_API_KEY),
        senderEmail: clean(process.env.BREVO_SENDER_EMAIL),
        senderName:
            clean(process.env.BREVO_SENDER_NAME) ?? "Vee's Nail Studio",
        adminNotificationEmail: clean(process.env.ADMIN_NOTIFICATION_EMAIL),
    };
}

export function getAppBaseUrl() {
    const configured =
        clean(process.env.NEXT_PUBLIC_SITE_URL) ??
        clean(process.env.NEXT_PUBLIC_BASE_URL);

    return configured?.replace(/\/+$/, "") ?? "";
}
