import { redirect } from "next/navigation";

import { routes } from "@/constants/routes";
import { getProfileOnboardingState } from "@/features/profile/data/onboarding";

export async function requireCompleteProfile(userId: string) {
    const profile = await getProfileOnboardingState(userId);

    if (!profile?.profile_completed_at) {
        redirect(routes.completeProfile);
    }

    return profile;
}
