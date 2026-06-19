import ProfileForm from "@/features/profile/components/ProfileForm";
import EmailChangeForm from "@/features/profile/components/EmailChangeForm";
import PasswordChangeForm from "@/features/profile/components/PasswordChangeForm";
import Reveal from "@/components/shared/motion/Reveal";
import SectionIntro from "@/components/shared/ui/SectionIntro";
import { getCurrentProfile } from "@/features/profile/data/profile";
import QuickActions from "@/features/dashboard/components/QuickActions";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Profile",
    description:
        "Manage profile and contact details used for appointment updates (private).",
    path: "/profile",
    noIndex: true,
});

function cleanPhone(phone: string | null) {
    if (!phone) return null;

    return phone.replace(/^\+1/, "");
}

export default async function ProfilePage() {
    const profile = await getCurrentProfile();

    if (!profile) {
        console.error("[profile:page] Profile unavailable");

        throw new Error("We couldn't load your profile right now.");
    }

    return (
        <div className="space-y-6 pb-12 lg:space-y-8">
            <SectionIntro
                eyebrow="Account"
                title="Your profile"
                description="Manage the details used for appointment updates, booking confirmations, and studio communication."
            />

            <div className="mx-auto w-full max-w-xl space-y-6 lg:max-w-2xl xl:max-w-3xl">
                <Reveal>
                    <ProfileForm
                        displayName={profile.display_name}
                        phone={cleanPhone(profile.phone)}
                        instagramHandle={profile.instagram_handle}
                        preferredContactMethod={
                            profile.preferred_contact_method ?? "email"
                        }
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

            <Reveal delay={0.18}>
                <QuickActions />
            </Reveal>
        </div>
    );
}
