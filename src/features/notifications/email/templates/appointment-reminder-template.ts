import {
    detailBlock,
    emailLayout,
    escapeHtml,
} from "@/features/notifications/email/templates/layout";

export function appointmentReminderTemplate({
    name,
    reference,
    appointmentDate,
    startTime,
    endTime,
    serviceSummary,
    studioAddress,
    buzzerCode,
    detailsUrl,
}: {
    name: string;
    reference: string;
    appointmentDate: string;
    startTime: string;
    endTime: string | null;
    serviceSummary: string;
    studioAddress: string | null;
    buzzerCode: string | null;
    detailsUrl?: string;
}) {
    const subject = `Appointment reminder · ${reference}`;
    const rows: Array<[string, string]> = [
        ["Booking", reference],
        ["Date", appointmentDate],
        ["Time", endTime ? `${startTime} – ${endTime}` : startTime],
        ["Services", serviceSummary],
    ];

    if (studioAddress) rows.push(["Studio address", studioAddress]);
    if (buzzerCode) rows.push(["Buzzer code", buzzerCode]);

    const arrivalNote = "Please arrive 15 minutes early.";

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
            body: `<p>Hi ${escapeHtml(name)},</p><p>A quick reminder that your appointment is tomorrow.</p>${detailBlock(rows)}<p><strong>${escapeHtml(arrivalNote)}</strong></p>`,
            cta: detailsUrl
                ? { label: "View appointment", href: detailsUrl }
                : undefined,
        }),
    };
}
