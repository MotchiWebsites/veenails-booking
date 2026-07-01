"use client";

import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { FiChevronLeft, FiChevronRight, FiHome } from "react-icons/fi";
import { CiHeart } from "react-icons/ci";
import DashboardNavItem from "@/components/navigation/dashboard/DashboardNavItem";
import UserAvatar from "@/components/dashboard/UserAvatar";
import { navItems } from "@/constants/dashboard/nav-items";
import SignOutButton from "@/components/shared/auth/SignOutButton";

export default function DashboardSidebar({
    user,
    displayName,
    collapsed,
    onToggle,
}: {
    user: User;
    displayName: string;
    collapsed: boolean;
    onToggle: () => void;
}) {
    const firstName = String(displayName).split(" ")[0];

    return (
        <aside
            className={[
                "sticky top-0 hidden h-screen shrink-0 border-r border-border/60 bg-surface/85 px-3 py-4 shadow-sm backdrop-blur lg:flex lg:flex-col",
                "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                collapsed ? "w-21" : "w-72",
            ].join(" ")}
        >
            <div
                className={[
                    "flex items-center gap-3 px-2 transition-all duration-300",
                    collapsed ? "justify-center" : "justify-between",
                ].join(" ")}
            >
                <Link
                    href="/dashboard"
                    className={[
                        "link-clean flex min-w-0 items-center gap-3 rounded-2xl transition-all duration-300",
                        collapsed ? "justify-center" : "",
                    ].join(" ")}
                >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-background shadow-sm">
                        <Image
                            src="/logo.png"
                            alt="Vee's Nail Studio"
                            fill
                            sizes="44px"
                            className="object-cover"
                            priority
                        />
                    </div>

                    <div
                        className={[
                            "min-w-0 overflow-hidden leading-tight transition-all duration-300",
                            collapsed
                                ? "w-0 opacity-0"
                                : "w-44 opacity-100 delay-100",
                        ].join(" ")}
                    >
                        <p className="truncate text-sm font-semibold">
                            Vee&apos;s Nail Studio
                        </p>
                        <p className="text-xs text-muted">Booking Portal</p>
                    </div>
                </Link>
            </div>

            <button
                type="button"
                onClick={onToggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
                className={[
                    "absolute -right-3 top-1/2 z-50 flex h-8 w-8 items-center justify-center rounded-full -translate-y-1/2 transform",
                    "border border-border/70 bg-background text-muted shadow-md shadow-black/5",
                    "transition-all duration-200 hover:scale-105 hover:bg-surface-2 hover:text-pink-main",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                ].join(" ")}
            >
                {collapsed ? (
                    <FiChevronRight className="h-5 w-5" />
                ) : (
                    <FiChevronLeft className="h-5 w-5" />
                )}
            </button>

            <div
                className={[
                    "mt-4 overflow-hidden px-3 transition-all duration-300",
                    collapsed
                        ? "max-h-0 opacity-0"
                        : "max-h-16 opacity-100 delay-100",
                ].join(" ")}
            >
                <p className="flex flex-row items-center gap-1 text-xs text-muted">
                    {`Hello, ${firstName}`}{" "}
                    <CiHeart className="inline-block h-4 w-4 text-pink-main" />
                </p>
                <div className="mt-3 border-t border-border/60" />
            </div>

            <nav className="mt-4 flex flex-1 flex-col gap-2 lg:mt-8">
                {navItems.map((item) => (
                    <DashboardNavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        collapsed={collapsed}
                    />
                ))}
            </nav>

            <div className="space-y-3 border-t border-border/60 pt-4">
                <DashboardNavItem
                    href="/"
                    label="Back to Home"
                    icon={FiHome}
                    collapsed={collapsed}
                />

                <div className={collapsed ? "flex justify-center px-2" : ""}>
                    <SignOutButton collapsed={collapsed} />
                </div>

                <div
                    className={[
                        "rounded-2xl bg-background p-3 transition-all duration-300",
                        collapsed ? "flex justify-center px-2" : "",
                    ].join(" ")}
                >
                    <UserAvatar
                        user={user}
                        displayName={displayName}
                        showText={!collapsed}
                    />
                </div>
            </div>
        </aside>
    );
}
