import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import { getUser } from "@/lib/auth/get-user";

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
