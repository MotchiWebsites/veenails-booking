import { timingSafeEqual } from "node:crypto";
import { sendAppointmentReminders } from "@/features/notifications/reminders/send-appointment-reminders";

function isAuthorized(request: Request) {
    const secret = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization");
    if (!secret || !authorization) return false;

    const expected = Buffer.from(`Bearer ${secret}`);
    const received = Buffer.from(authorization);
    return (
        expected.length === received.length &&
        timingSafeEqual(expected, received)
    );
}

export async function GET(request: Request) {
    if (!isAuthorized(request)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await sendAppointmentReminders();
        return Response.json(result);
    } catch (error) {
        console.error("[cron:appointment-reminders]", error);
        return Response.json(
            { error: "Reminder processing failed." },
            { status: 500 },
        );
    }
}
