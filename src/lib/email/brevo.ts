import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TransactionalEmail = {
    to: { email: string; name?: string | null };
    subject: string;
    html: string;
    text: string;
    notificationType: string;
    bookingId?: string | null;
    userId?: string | null;
};

export async function sendTransactionalEmail(input: TransactionalEmail) {
    const admin = createAdminClient();
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME ?? "Vee's Nail Studio";

    if (!apiKey || !senderEmail) {
        await admin.from("notification_logs").insert({
            booking_id: input.bookingId ?? null,
            user_id: input.userId ?? null,
            notification_type: input.notificationType,
            recipient_email: input.to.email,
            subject: input.subject,
            provider: "brevo",
            status: "skipped",
            error_message: "Brevo environment variables are not configured.",
        });
        return { sent: false, skipped: true };
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({
                sender: { email: senderEmail, name: senderName },
                to: [{ email: input.to.email, name: input.to.name ?? undefined }],
                subject: input.subject,
                htmlContent: input.html,
                textContent: input.text,
            }),
        });
        const payload = await response.json().catch(() => ({})) as { messageId?: string; message?: string };
        if (!response.ok) throw new Error(payload.message || `Brevo returned ${response.status}`);

        await admin.from("notification_logs").insert({
            booking_id: input.bookingId ?? null,
            user_id: input.userId ?? null,
            notification_type: input.notificationType,
            recipient_email: input.to.email,
            subject: input.subject,
            provider: "brevo",
            provider_message_id: payload.messageId ?? null,
            status: "sent",
            sent_at: new Date().toISOString(),
        });
        return { sent: true, skipped: false };
    } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown Brevo error";
        console.error("[email:brevo]", message);
        await admin.from("notification_logs").insert({
            booking_id: input.bookingId ?? null,
            user_id: input.userId ?? null,
            notification_type: input.notificationType,
            recipient_email: input.to.email,
            subject: input.subject,
            provider: "brevo",
            status: "failed",
            error_message: message,
        });
        return { sent: false, skipped: false };
    }
}
