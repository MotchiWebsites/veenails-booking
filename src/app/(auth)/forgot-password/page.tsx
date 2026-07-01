import Link from "next/link";
import AuthCard from "@/features/auth/components/AuthCard";
import ForgotPasswordForm from "@/features/auth/components/forms/ForgotPasswordForm";
import { routes } from "@/constants/routes";
import Reveal from "@/components/shared/motion/Reveal";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Reset Password",
    description: "Request a password reset link for your booking account.",
    path: "/forgot-password",
    noIndex: true,
});

type ForgotPasswordPageProps = {
    searchParams: Promise<{
        authError?: string | string[];
    }>;
};

export default async function ForgotPasswordPage({
    searchParams,
}: ForgotPasswordPageProps) {
    const params = await searchParams;
    const authError = Array.isArray(params.authError)
        ? params.authError[0]
        : params.authError;

    return (
        <Reveal>
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
                <ForgotPasswordForm initialAuthError={authError} />
            </AuthCard>
        </Reveal>
    );
}
