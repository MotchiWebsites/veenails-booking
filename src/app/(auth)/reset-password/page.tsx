import AuthCard from "@/features/auth/components/AuthCard";
import ResetPasswordForm from "@/features/auth/components/forms/ResetPasswordForm";

export default function ResetPasswordPage() {
    return (
        <AuthCard
            eyebrow="Choose a new password"
            title="Reset password"
            description="Enter a new password for your Vee's Nail Studio booking account."
        >
            <ResetPasswordForm />
        </AuthCard>
    );
}
