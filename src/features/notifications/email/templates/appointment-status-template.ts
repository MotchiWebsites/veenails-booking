import { detailBlock, emailLayout, escapeHtml } from "@/features/notifications/email/templates/layout";

export function appointmentStatusTemplate({ name, reference, status, appointment, message, detailsUrl }: { name: string; reference: string; status: string; appointment: string; message: string; detailsUrl?: string }) {
    const subject = `Appointment ${status} · ${reference}`;
    return {
        subject,
        text: `Hi ${name},\n\n${message}\n\nBooking: ${reference}\nAppointment: ${appointment}\nStatus: ${status}\n\nVee’s Nail Studio`,
        html: emailLayout({ heading: `Appointment ${status}`, preview: subject, body: `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(message)}</p>${detailBlock([["Booking", reference], ["Appointment", appointment], ["Status", status]])}`, cta: detailsUrl ? { label: "View appointment", href: detailsUrl } : undefined }),
    };
}
