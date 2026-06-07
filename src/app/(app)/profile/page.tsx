import ProfileForm from "@/features/profile/components/ProfileForm";
import EmailChangeForm from "@/features/profile/components/EmailChangeForm";
import PasswordChangeForm from "@/features/profile/components/PasswordChangeForm";
import Reveal from "@/components/shared/motion/Reveal";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import { getCurrentProfile } from "@/features/profile/data/profile";
import QuickActions from "@/components/dashboard/QuickActions";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Profile",
    description:
        "Manage profile and contact details used for appointment updates (private).",
    path: "/profile",
    noIndex: true,
});

export default async function ProfilePage() {
    const cleanedPhone = (phone: string | null) => {
        if (!phone) return null;

        // Remove +1 country code
        return phone.replace(/^\+1/, "");
    };

    const profile = await getCurrentProfile();

    if (!profile) {
        return (
            <div className="rounded-3xl border border-border/60 bg-surface p-6 text-center shadow-sm">
                <h1 className="text-2xl font-semibold">Profile unavailable</h1>
                <p className="mt-2 text-sm text-muted">
                    We could not load your profile. Please try again.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-8 pb-12">
            <SectionIntro
                eyebrow="Account"
                title="Your profile"
                description="Manage the details used for appointment updates, booking confirmations, and studio communication."
            />

            <div>
                <div className="mx-auto w-full max-w-xl lg:max-w-2xl xl:max-w-3xl space-y-6">
                    <Reveal>
                        <ProfileForm
                            displayName={profile.display_name}
                            phone={cleanedPhone(profile.phone)}
                            createdAt={profile.created_at}
                        />
                    </Reveal>

                    <Reveal delay={0.06}>
                        <EmailChangeForm currentEmail={profile.email} />
                    </Reveal>

                    <Reveal delay={0.12}>
                        <PasswordChangeForm />
                    </Reveal>
                </div>
            </div>

            <Reveal delay={0.18}>
                <QuickActions />
            </Reveal>
        </div>
    );
}
