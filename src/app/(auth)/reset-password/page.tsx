import Reveal from "@/components/shared/motion/Reveal";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Choose New Password",
    description: "Choose a new password for your booking account.",
    path: "/reset-password",
    noIndex: true,
});
import AuthCard from "@/features/auth/components/AuthCard";
import ResetPasswordForm from "@/features/auth/components/forms/ResetPasswordForm";

export default function ResetPasswordPage() {
    return (
        <Reveal>
            <AuthCard
                eyebrow="Choose a new password"
                title="Reset password"
                description="Enter a new password for your Vee's Nail Studio booking account."
            >
                <ResetPasswordForm />
            </AuthCard>
        </Reveal>
    );
}
