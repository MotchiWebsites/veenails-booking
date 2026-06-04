import { requireUser } from "@/features/auth/guards/require-user";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireUser();

    return <>{children}</>;
}
