import { redirect } from "next/navigation";

import AuthCard from "@/features/auth/components/AuthCard";
import { requireUser } from "@/features/auth/guards/require-user";
import CompleteProfileForm from "@/features/profile/components/CompleteProfileForm";
import { getProfileOnboardingState } from "@/features/profile/data/onboarding";
import { routes } from "@/constants/routes";
import Reveal from "@/components/shared/motion/Reveal";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Complete Your Profile",
    description: "Add your booking contact details.",
    path: "/complete-profile",
    noIndex: true,
});

export default async function CompleteProfilePage() {
    const user = await requireUser();
    const profile = await getProfileOnboardingState(user.id);

    if (profile?.profile_completed_at) {
        redirect(routes.dashboard);
    }

    if (!profile) {
        throw new Error("We couldn’t prepare your profile right now.");
    }

    return (
        <Reveal>
            <AuthCard
                eyebrow="One last step"
                title="Complete your profile"
                description="Add the contact details the studio will use for appointment updates and design inspiration."
            >
                <CompleteProfileForm
                    displayName={profile.display_name}
                    phone={profile.phone}
                    instagramHandle={profile.instagram_handle}
                    preferredContactMethod={
                        profile.preferred_contact_method ?? "email"
                    }
                />
            </AuthCard>
        </Reveal>
    );
}
