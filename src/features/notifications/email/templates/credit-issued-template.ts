import { detailBlock, emailLayout, escapeHtml } from "@/features/notifications/email/templates/layout";

export function creditIssuedTemplate({ name, amount, reason, expiresAt, creditsUrl }: { name: string; amount: string; reason: string; expiresAt?: string | null; creditsUrl?: string }) {
    const subject = `Studio credit issued · ${amount}`;
    const rows: Array<[string, string]> = [["Credit amount", amount], ["Reason", reason]];
    if (expiresAt) rows.push(["Expires", expiresAt]);
    return {
        subject,
        text: `Hi ${name},\n\nA ${amount} credit was added to your Vee’s Nail Studio account.\nReason: ${reason}${expiresAt ? `\nExpires: ${expiresAt}` : ""}`,
        html: emailLayout({ heading: "Studio credit issued", preview: subject, body: `<p>Hi ${escapeHtml(name)},</p><p>A credit has been added to your account and can be applied to a future booking.</p>${detailBlock(rows)}`, cta: creditsUrl ? { label: "View credits", href: creditsUrl } : undefined }),
    };
}
