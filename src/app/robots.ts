import type { MetadataRoute } from "next";

function getSiteUrl() {
    const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    if (!raw) return "http://localhost:3000";
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
    return `https://${raw.replace(/\/$/, "")}`;
}

export default function robots(): MetadataRoute.Robots {
    const baseUrl = getSiteUrl();

    const disallow = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/dashboard",
        "/profile",
        "/booking",
        "/admin",
        "/credits",
        "/settings",
        "/api",
    ];

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow,
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
