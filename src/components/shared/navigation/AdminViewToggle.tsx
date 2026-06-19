"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiBriefcase, FiUser } from "react-icons/fi";

export default function AdminViewToggle({
    isAdmin,
    className = "",
}: {
    isAdmin: boolean;
    className?: string;
}) {
    const pathname = usePathname();
    const [pendingHref, setPendingHref] = useState<string | null>(null);

    const inAdminView = pathname.startsWith("/admin");
    const href = inAdminView ? "/dashboard" : "/admin";
    const label = inAdminView ? "Admin view" : "Client view";
    const shortLabel = inAdminView ? "Admin" : "Client";

    const reachedPendingTarget = pendingHref
        ? pendingHref === "/admin"
            ? pathname.startsWith("/admin")
            : pathname === pendingHref || pathname.startsWith(pendingHref)
        : false;
    const switching = pendingHref !== null && !reachedPendingTarget;
    const visualAdminView = switching
        ? pendingHref.startsWith("/admin")
        : inAdminView;
    const Icon = visualAdminView ? FiBriefcase : FiUser;

    if (!isAdmin) {
        return null;
    }

    return (
        <Link
            href={href}
            aria-label={`Switch to ${label}`}
            aria-busy={switching}
            onClick={() => setPendingHref(href)}
            className={[
                "group inline-flex max-w-full items-center gap-3 rounded-full border border-border/60 bg-surface px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition duration-200",
                "hover:border-dark-green/40 hover:bg-background hover:text-dark-green",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                switching ? "pointer-events-none opacity-75" : "",
                className,
            ].join(" ")}
        >
            <span
                className={[
                    "relative flex h-7 w-12 shrink-0 items-center rounded-full border border-border/60 p-0.5 transition-colors duration-300",
                    visualAdminView ? "bg-dark-green/15" : "bg-pink-50",
                ].join(" ")}
                aria-hidden="true"
            >
                <span
                    className={[
                        "flex h-6 w-6 items-center justify-center rounded-full bg-surface text-foreground shadow-sm transition-transform duration-300 ease-out",
                        visualAdminView ? "translate-x-5" : "translate-x-0",
                    ].join(" ")}
                >
                    <Icon className="h-3.5 w-3.5" />
                </span>
            </span>

            <span className="min-w-0 leading-tight">
                <span className="block truncate text-xs sm:hidden">
                    {shortLabel}
                </span>
                <span className="hidden truncate sm:block">{label}</span>
                <span className="hidden text-[0.68rem] font-medium text-muted sm:block">
                    {visualAdminView ? "Switch to Client mode" : "Switch to Admin mode"}
                </span>
            </span>
        </Link>
    );
}
