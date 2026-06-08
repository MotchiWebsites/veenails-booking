"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";

export default function DashboardNavItem({
    href,
    label,
    icon: Icon,
    collapsed = false,
    onClick,
}: {
    href: string;
    label: string;
    icon: IconType;
    collapsed?: boolean;
    onClick?: () => void;
}) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            onClick={onClick}
            className={[
                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200",
                active
                    ? "bg-pink-main text-white shadow-sm"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                collapsed ? "justify-center" : "",
            ].join(" ")}
        >
            <Icon
                className={[
                    "h-5 w-5 shrink-0 transition-colors",
                    active
                        ? "text-white"
                        : "text-muted group-hover:text-pink-main",
                ].join(" ")}
            />

            {!collapsed ? <span>{label}</span> : null}
        </Link>
    );
}
