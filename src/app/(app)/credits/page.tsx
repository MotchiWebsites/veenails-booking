import { buildMetadata } from "@/lib/seo/metadata";
import { requireUser } from "@/features/auth/guards/require-user";
import { getCreditsPageData } from "@/features/credits/data/credits";
import CreditsPageView from "@/features/credits/components/CreditsPageView";

export const metadata = buildMetadata({
    title: "Credits",
    description:
        "View account credits available for future appointments and past credits that have already been used or expired (private).",
    path: "/credits",
    noIndex: true,
});

export default async function CreditsPage() {
    const user = await requireUser();
    const data = await getCreditsPageData(user.id);

    return <CreditsPageView data={data} />;
}
