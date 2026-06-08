"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import type { User } from "@supabase/supabase-js";

import { FiCalendar, FiChevronDown, FiHome, FiUser, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/dashboard/UserAvatar";

import { useClickAway } from "@/lib/hooks/use-click-away";
import SignOutButton from "@/components/shared/auth/SignOutButton";

function getDisplayName(user: User) {
    return (
        user.user_metadata?.full_name ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Client"
    );
}

const menuItems = [
    {
        href: "/book",
        label: "New Booking",
        description: "Request your next appointment",
        icon: FiCalendar,
    },
    {
        href: "/dashboard",
        label: "Dashboard",
        description: "View your account overview",
        icon: FiHome,
    },
    {
        href: "/profile",
        label: "Profile",
        description: "Update your account details",
        icon: FiUser,
    },
];

export default function DashboardUserMenu({ user }: { user: User }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    const displayName = getDisplayName(user);

    useClickAway({
        ref,
        enabled: open,
        onClickAway: () => setOpen(false),
    });

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-label="Open account menu"
                className="group flex items-center gap-2 rounded-full border border-border bg-surface p-1.5 pr-2 shadow-sm transition-all duration-200 hover:bg-surface-2 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
                <UserAvatar user={user} showText={false} />

                <FiChevronDown
                    className={`hidden h-4 w-4 text-muted transition-transform duration-200 sm:block ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            <AnimatePresence>
                {open ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{
                            duration: 0.18,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-border/70 bg-background shadow-2xl shadow-black/10"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-surface/80 p-4">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">
                                    {displayName}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted">
                                    {user.email}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close account menu"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                            >
                                <FiX className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className="group flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-surface-2 duration-300 ease-in-out"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-main duration-300 ease-in-out transition-colors group-hover:bg-pink-main group-hover:text-white">
                                            <Icon className="h-4 w-4" />
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold text-foreground">
                                                {item.label}
                                            </span>
                                            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                                                {item.description}
                                            </span>
                                        </span>
                                    </Link>
                                );
                            })}
                            <SignOutButton
                                variant="button"
                                onBeforeSignOut={() => setOpen(false)}
                                className="mt-2"
                            />
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
