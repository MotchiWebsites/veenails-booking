import Link from "next/link";
import AuthCard from "@/features/auth/components/AuthCard";
import SignupForm from "@/features/auth/components/forms/SignupForm";
import { routes } from "@/constants/routes";
import Reveal from "@/components/shared/motion/Reveal";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
    title: "Create Account",
    description: "Create an account to request appointments and manage bookings.",
    path: "/signup",
    noIndex: true,
});

export default function SignupPage() {
    return (
        <Reveal>
            <AuthCard
                title="Create your account"
                description="Set up your booking account to request appointments and receive updates."
                topAction={
                    <>
                        Already have an account?{" "}
                        <Link
                            href={routes.login}
                            className="link-default font-semibold"
                        >
                            Sign in
                        </Link>
                    </>
                }
                footer={
                    <>
                        Already have an account?{" "}
                        <Link
                            href={routes.login}
                            className="link-default font-semibold"
                        >
                            Sign in
                        </Link>
                    </>
                }
            >
                <SignupForm />
            </AuthCard>
        </Reveal>
    );
}
