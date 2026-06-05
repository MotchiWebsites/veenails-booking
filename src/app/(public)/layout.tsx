import PublicNavbar from "@/components/navigation/public/PublicNavbar";
import PublicFooter from "@/components/navigation/public/PublicFooter";
import { getUser } from "@/features/auth/guards/get-user";

export default async function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getUser();

    const primaryHref = user ? "/booking/new" : "/signup";
    const primaryLabel = user ? "Start Booking" : "Create Account";

    const secondaryHref = user ? "/dashboard" : "/login";
    const secondaryLabel = user ? "Go to Dashboard" : "Sign In";

    return (
        <>
            <PublicNavbar
                primaryHref={primaryHref}
                primaryLabel={primaryLabel}
                secondaryHref={secondaryHref}
                secondaryLabel={secondaryLabel}
            />

            {children}

            <PublicFooter />
        </>
    );
}
