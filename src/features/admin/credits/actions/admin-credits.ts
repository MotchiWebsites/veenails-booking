"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth/require-admin";
import { creditIssuedTemplate } from "@/features/notifications/email/templates/credit-issued-template";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { getAppBaseUrl } from "@/lib/email/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCreditState = { error: string; success: string; messageId: string };
function response(input: Omit<AdminCreditState, "messageId">): AdminCreditState { return { ...input, messageId: `${Date.now()}-${Math.random().toString(36).slice(2)}` }; }
function text(data: FormData, key: string) { const value = data.get(key); return typeof value === "string" ? value.trim() : ""; }

export async function issueAdminCreditAction(_previous: AdminCreditState, formData: FormData): Promise<AdminCreditState> {
    const { user: adminUser } = await requireAdmin();
    const userId = text(formData, "userId");
    const bookingId = text(formData, "bookingId") || null;
    const reason = text(formData, "reason");
    const amount = Number(text(formData, "amount"));
    const expiry = text(formData, "expiresAt");

    if (!userId || !Number.isFinite(amount) || amount <= 0 || amount > 10_000) return response({ error: "Enter a valid positive credit amount.", success: "" });
    if (reason.length < 4) return response({ error: "Add a reason for this credit.", success: "" });
    const expiresAt = expiry ? new Date(`${expiry}T23:59:59.999`).toISOString() : null;
    if (expiresAt && new Date(expiresAt) <= new Date()) return response({ error: "Credit expiry must be in the future.", success: "" });

    const admin = createAdminClient();
    try {
        const { data: profile, error: profileError } = await admin.from("profiles").select("id, display_name, email").eq("id", userId).maybeSingle().overrideTypes<{ id: string; display_name: string; email: string } | null>();
        if (profileError || !profile) return response({ error: "That client could not be found.", success: "" });
        if (bookingId) {
            const { data: booking } = await admin.from("bookings").select("id").eq("id", bookingId).eq("user_id", userId).maybeSingle();
            if (!booking) return response({ error: "That appointment does not belong to this client.", success: "" });
        }

        const { data: credit, error } = await admin.from("user_credits").insert({ user_id: userId, amount, reason, expires_at: expiresAt, source_booking_id: bookingId }).select("id").single();
        if (error || !credit) throw error ?? new Error("Credit insert failed");

        if (bookingId) {
            const { error: eventError } = await admin.from("booking_events").insert({ booking_id: bookingId, actor_type: "admin", actor_user_id: adminUser.id, event_type: "admin_credit_issued", message: `Admin issued a $${amount.toFixed(2)} studio credit.`, metadata: { creditId: credit.id, amount, reason, expiresAt } });
            if (eventError) throw eventError;
        }

        revalidatePath(`/admin/users/${userId}`); revalidatePath("/admin/users"); revalidatePath("/credits");
        if (bookingId) revalidatePath(`/admin/appointments/${bookingId}`);

        const siteUrl = getAppBaseUrl();
        const template = creditIssuedTemplate({ name: profile.display_name, amount: new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount), reason, expiresAt: expiresAt ? new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(new Date(expiresAt)) : null, creditsUrl: siteUrl ? `${siteUrl}/credits` : undefined });
        await sendTransactionalEmail({ to: { email: profile.email, name: profile.display_name }, ...template, notificationType: "credit_issued", deduplicationKey: `credit_issued:${credit.id}`, bookingId, userId });
        return response({ error: "", success: "Credit issued successfully." });
    } catch (error) {
        console.error("[admin:credits:issue]", error);
        return response({ error: "We couldn't issue that credit. Please review the details and try again.", success: "" });
    }
}
