import { detailBlock, emailLayout, escapeHtml } from "@/features/notifications/email/templates/layout";

export function cancellationTemplate({ name, reference, heading, appointment, reason, outcome, message, detailsUrl }: { name: string; reference: string; heading: string; appointment: string; reason: string; outcome: string; message: string; detailsUrl?: string }) {
    const subject = `${heading} · ${reference}`;
    return {
        subject,
        text: `Hi ${name},\n\n${message}\n\nBooking: ${reference}\nAppointment: ${appointment}\nReason: ${reason}\nOutcome: ${outcome}\n\nVee’s Nail Studio`,
        html: emailLayout({ heading, preview: subject, body: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(message)}</p>${detailBlock([["Booking", reference], ["Appointment", appointment], ["Reason", reason], ["Outcome", outcome]])}`, cta: detailsUrl ? { label: "View appointment", href: detailsUrl } : undefined }),
    };
}
