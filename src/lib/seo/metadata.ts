import type { Metadata } from "next";

const FALLBACK_LOCAL = "http://localhost:3000";

export const siteConfig = {
    siteName: "Vee's Nail Studio",
    productName: "Vee's Nail Studio Booking Portal",
    marketingUrl: "https://veenailstudio.ca",
    defaultImage: "/opengraph-image.png",
    twitterImage: "/twitter-image.png",
};

function getSiteUrlEnv(): string {
    const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    if (!raw) return FALLBACK_LOCAL;

    // If the value already contains protocol, return as-is
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");

    // otherwise assume https
    return `https://${raw.replace(/\/$/, "")}`;
}

export function absoluteUrl(path = "/") {
    const base = getSiteUrlEnv();
    if (!path.startsWith("/")) path = `/${path}`;
    return `${base}${path}`;
}

type BuildOpts = {
    title?: string;
    description?: string;
    path?: string;
    image?: string;
    noIndex?: boolean;
    robots?: Metadata["robots"];
};

export function buildMetadata(opts: BuildOpts = {}): Metadata {
    const base = getSiteUrlEnv();
    const title = opts.title
        ? `${opts.title} | ${siteConfig.siteName}`
        : `Book an Appointment | ${siteConfig.siteName}`;

    const description =
        opts.description ||
        "Book and manage your Vee's Nail Studio appointments through a secure online booking portal.";

    const image = opts.image || siteConfig.defaultImage;
    const url = opts.path ? absoluteUrl(opts.path) : base + "/";

    const metadata: Metadata = {
        title,
        metadataBase: new URL(base),
        applicationName: siteConfig.productName,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: siteConfig.siteName,
            images: [image],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [opts.image || siteConfig.twitterImage],
        },
        alternates: {
            canonical: opts.path || "/",
        },
        icons: {
            icon: "/favicon.ico",
            apple: "/icon.svg",
        },
    };

    if (opts.noIndex) {
        metadata.robots = {
            index: false,
            follow: false,
        };
    } else if (opts.robots) {
        metadata.robots = opts.robots;
    }

    return metadata;
}

export default buildMetadata;
