import Link from "next/link";
import AuthCard from "@/features/auth/components/AuthCard";
import LoginForm from "@/features/auth/components/forms/LoginForm";
import { routes } from "@/constants/routes";
import Reveal from "@/components/motion/Reveal";

export default function LoginPage() {
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
                <LoginForm />
            </AuthCard>
        </Reveal>
    );
}
