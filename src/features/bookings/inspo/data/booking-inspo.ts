import type { Enums } from "@/types/supabase";

export type BookingInspoStatus = Enums<"booking_inspo_status">;

export function getBookingInspoStatusLabel(
    status: BookingInspoStatus | null | undefined,
) {
    if (status === "reviewed") {
        return "Design inspo reviewed";
    }

    if (status === "sent") {
        return "Design inspo sent";
    }

    return "Design inspo not sent yet";
}

export function shouldShowBookingInspoSubmission(
    status: BookingInspoStatus | null | undefined,
) {
    return status !== "reviewed";
}
