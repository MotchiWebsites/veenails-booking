import Link from "next/link";
import AuthCard from "@/features/auth/components/AuthCard";
import LoginForm from "@/features/auth/components/forms/LoginForm";
import { routes } from "@/constants/routes";
import Reveal from "@/components/shared/motion/Reveal";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Sign In",
    description: "Sign in to manage your bookings and account.",
    path: "/login",
    noIndex: true,
});

type LoginPageProps = {
    searchParams: Promise<{
        authError?: string | string[];
    }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    const authError = Array.isArray(params.authError)
        ? params.authError[0]
        : params.authError;

    return (
        <Reveal>
            <AuthCard
                eyebrow="Welcome back!"
                title="Sign in"
                description="Access your booking dashboard, appointment status, and account details."
                topAction={
                    <>
                        Don&apos;t have an account?{" "}
                        <Link
                            href={routes.signup}
                            className="link-default font-semibold"
                        >
                            Create one
                        </Link>
                    </>
                }
                footer={
                    <>
                        Don&apos;t have an account?{" "}
                        <Link
                            href={routes.signup}
                            className="link-default font-semibold"
                        >
                            Create one
                        </Link>
                    </>
                }
            >
                <LoginForm initialAuthError={authError} />
            </AuthCard>
        </Reveal>
    );
}
