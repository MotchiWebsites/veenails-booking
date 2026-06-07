import type { Database } from "@/types/supabase";

export type UserCreditRow = Database["public"]["Tables"]["user_credits"]["Row"];
export type CreditStatus = "Available" | "Used" | "Expired" | "Inactive";

export function getCreditStatus(
    credit: Pick<UserCreditRow, "active" | "expires_at" | "used_at">,
    now = new Date(),
): CreditStatus {
    if (credit.used_at) {
        return "Used";
    }

    if (credit.expires_at && new Date(credit.expires_at).getTime() < now.getTime()) {
        return "Expired";
    }

    if (!credit.active) {
        return "Inactive";
    }

    return "Available";
}

export function isAvailableCredit(
    credit: Pick<UserCreditRow, "active" | "expires_at" | "used_at">,
    now = new Date(),
) {
    return getCreditStatus(credit, now) === "Available";
}

export function getCreditReason(reason: string | null) {
    return reason?.trim() || "Account credit";
}
