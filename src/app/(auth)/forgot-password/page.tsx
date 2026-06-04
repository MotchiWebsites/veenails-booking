import Link from "next/link";
import AuthCard from "@/features/auth/components/AuthCard";
import ForgotPasswordForm from "@/features/auth/components/forms/ForgotPasswordForm";
import { routes } from "@/constants/routes";

export default function ForgotPasswordPage() {
    return (
        <AuthCard
            eyebrow="Account help"
            title="Reset your password"
            description="Enter your email and we'll send you a secure link to reset your password."
            footer={
                <>
                    Remembered it?{" "}
                    <Link
                        href={routes.login}
                        className="link-default font-semibold"
                    >
                        Sign in
                    </Link>
                </>
            }
        >
            <ForgotPasswordForm />
        </AuthCard>
    );
}
