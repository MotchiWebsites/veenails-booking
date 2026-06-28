import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/supabase";

export type TransactionalEmail = {
    to: { email: string | null; name?: string | null };
    bcc?: Array<{ email: string; name?: string | null }>;
    subject: string;
    html: string;
    text: string;
    notificationType: string;
    deduplicationKey?: string;
    bookingId?: string | null;
    userId?: string | null;
};

export async function sendTransactionalEmail(input: TransactionalEmail) {
    const admin = createAdminClient();
    const recipientEmail = input.to.email?.trim() || null;
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME ?? "Vee's Nail Studio";
    const terminalStatuses: Enums<"notification_status">[] = [
        "pending",
        "sent",
        "skipped",
    ];
    const deduplicationKey =
        input.deduplicationKey ??
        (input.bookingId
            ? `${input.bookingId}:${input.notificationType}`
            : null);

    if (deduplicationKey) {
        const { data: existing, error } = await admin
            .from("notification_logs")
            .select("id, status")
            .eq("deduplication_key", deduplicationKey)
            .in("status", terminalStatuses)
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        if (existing) {
            return { sent: false, skipped: true, duplicate: true };
        }
    }

    if (!recipientEmail) {
        const { error } = await admin.from("notification_logs").insert({
            booking_id: input.bookingId ?? null,
            user_id: input.userId ?? null,
            deduplication_key: deduplicationKey,
            notification_type: input.notificationType,
            recipient_email: null,
            subject: input.subject,
            provider: "brevo",
            status: "skipped",
            error_message:
                "Skipped: booking has no email recipient. Client contact is Instagram-only.",
        });
        if (error?.code !== "23505") {
            if (error) throw error;
        }
        return { sent: false, skipped: true, duplicate: false };
    }

    if (!apiKey || !senderEmail) {
        await admin.from("notification_logs").insert({
            booking_id: input.bookingId ?? null,
            user_id: input.userId ?? null,
            deduplication_key: deduplicationKey,
            notification_type: input.notificationType,
            recipient_email: recipientEmail,
            subject: input.subject,
            provider: "brevo",
            status: "failed",
            error_message: "Brevo environment variables are not configured.",
        });
        return { sent: false, skipped: true, duplicate: false };
    }

    const { data: pendingLog, error: pendingError } = await admin
        .from("notification_logs")
        .insert({
            booking_id: input.bookingId ?? null,
            user_id: input.userId ?? null,
            deduplication_key: deduplicationKey,
            notification_type: input.notificationType,
            recipient_email: recipientEmail,
            subject: input.subject,
            provider: "brevo",
            status: "pending",
        })
        .select("id")
        .single();

    if (pendingError?.code === "23505") {
        return { sent: false, skipped: true, duplicate: true };
    }
    if (pendingError || !pendingLog) {
        throw pendingError ?? new Error("Email log reservation failed.");
    }

    try {
        const bcc = (input.bcc ?? [])
            .map((recipient) => ({
                email: recipient.email.trim(),
                name: recipient.name ?? undefined,
            }))
            .filter(
                (recipient) =>
                    recipient.email &&
                    recipient.email.toLowerCase() !==
                        recipientEmail.toLowerCase(),
            );
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify({
                sender: { email: senderEmail, name: senderName },
                to: [{ email: recipientEmail, name: input.to.name ?? undefined }],
                bcc: bcc.length > 0 ? bcc : undefined,
                subject: input.subject,
                htmlContent: input.html,
                textContent: input.text,
            }),
        });
        const payload = await response.json().catch(() => ({})) as { messageId?: string; message?: string };
        if (!response.ok) throw new Error(payload.message || `Brevo returned ${response.status}`);

        await admin.from("notification_logs").update({
            provider_message_id: payload.messageId ?? null,
            status: "sent",
            sent_at: new Date().toISOString(),
        }).eq("id", pendingLog.id);
        return { sent: true, skipped: false, duplicate: false };
    } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown Brevo error";
        console.error("[email:brevo]", message);
        await admin.from("notification_logs").update({
            status: "failed",
            error_message: message,
        }).eq("id", pendingLog.id);
        return { sent: false, skipped: false, duplicate: false };
    }
}
