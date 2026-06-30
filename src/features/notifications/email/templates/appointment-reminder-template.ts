import {
    detailBlock,
    emailLayout,
    escapeHtml,
} from "@/features/notifications/email/templates/layout";
import {
    INSTAGRAM_ARRIVAL_FALLBACK,
    INSTAGRAM_ARRIVAL_MESSAGE,
    normalizeInstagramUrl,
} from "@/features/bookings/utils/instagram-contact";

export function appointmentReminderTemplate({
    name,
    reference,
    appointmentDate,
    startTime,
    endTime,
    serviceSummary,
    instagramUrl,
    detailsUrl,
}: {
    name: string;
    reference: string;
    appointmentDate: string;
    startTime: string;
    endTime: string | null;
    serviceSummary: string;
    instagramUrl: string | null;
    detailsUrl?: string;
}) {
    const subject = `Appointment reminder · ${reference}`;
    const rows: Array<[string, string]> = [
        ["Booking", reference],
        ["Date", appointmentDate],
        ["Time", endTime ? `${startTime} – ${endTime}` : startTime],
        ["Services", serviceSummary],
    ];

    const safeInstagramUrl = normalizeInstagramUrl(instagramUrl);
    const arrivalNote = safeInstagramUrl
        ? INSTAGRAM_ARRIVAL_MESSAGE
        : INSTAGRAM_ARRIVAL_FALLBACK;
    const arrivalHtml = safeInstagramUrl
        ? `<p><strong>${escapeHtml(INSTAGRAM_ARRIVAL_MESSAGE)}</strong></p><p><a href="${escapeHtml(safeInstagramUrl)}" target="_blank" rel="noopener noreferrer">Message us on Instagram</a></p>`
        : `<p><strong>${escapeHtml(INSTAGRAM_ARRIVAL_FALLBACK)}</strong></p>`;

    return {
        subject,
        text: [
            `Hi ${name},`,
            "",
            "A quick reminder that your appointment is tomorrow.",
            "",
            ...rows.map(([label, value]) => `${label}: ${value}`),
            "",
            arrivalNote,
            "",
            "Vee's Nail Studio",
        ].join("\n"),
        html: emailLayout({
            heading: "Your appointment is tomorrow",
            preview: subject,
            body: `<p>Hi ${escapeHtml(name)},</p><p>A quick reminder that your appointment is tomorrow.</p>${detailBlock(rows)}${arrivalHtml}`,
            cta: detailsUrl
                ? { label: "View appointment", href: detailsUrl }
                : undefined,
        }),
    };
}
