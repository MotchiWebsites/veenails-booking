import { FiExternalLink, FiInstagram } from "react-icons/fi";

import {
    INSTAGRAM_ARRIVAL_FALLBACK,
    INSTAGRAM_ARRIVAL_MESSAGE,
    normalizeInstagramUrl,
} from "@/features/bookings/utils/instagram-contact";

export default function StudioArrivalContactCard({
    instagramUrl,
}: {
    instagramUrl: string | null;
}) {
    const safeInstagramUrl = normalizeInstagramUrl(instagramUrl);

    return (
        <div className="mt-5 rounded-2xl border border-border/60 bg-surface-2 p-4">
            <div className="flex items-start gap-3">
                <FiInstagram
                    className="mt-0.5 h-5 w-5 shrink-0 text-dark-green"
                    aria-hidden="true"
                />
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        Studio arrival
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                        {safeInstagramUrl
                            ? INSTAGRAM_ARRIVAL_MESSAGE
                            : INSTAGRAM_ARRIVAL_FALLBACK}
                    </p>
                    {safeInstagramUrl ? (
                        <a
                            href={safeInstagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary mt-3 inline-flex items-center justify-center gap-2"
                        >
                            Message us on Instagram
                            <FiExternalLink
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                        </a>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
