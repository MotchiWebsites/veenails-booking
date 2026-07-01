"use client";

import Image from "next/image";
import Link from "next/link";

import type { User } from "@supabase/supabase-js";

import { FiHome, FiX } from "react-icons/fi";
import { CiHeart } from "react-icons/ci";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import DashboardNavItem from "@/components/navigation/dashboard/DashboardNavItem";
import UserAvatar from "@/components/dashboard/UserAvatar";
import { navItems } from "@/constants/dashboard/nav-items";
import SignOutButton from "@/components/shared/auth/SignOutButton";

export default function MobileSidebar({
    open,
    onClose,
    user,
    displayName,
}: {
    open: boolean;
    onClose: () => void;
    user: User;
    displayName: string;
}) {
    const firstName = String(displayName).split(" ")[0];

    const shouldReduceMotion = useReducedMotion();

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-50 lg:hidden"
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                    transition={{
                        duration: shouldReduceMotion ? 0 : 0.2,
                        ease: "easeOut",
                    }}
                >
                    <motion.button
                        type="button"
                        aria-label="Close navigation"
                        onClick={onClose}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        initial={shouldReduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                        transition={{
                            duration: shouldReduceMotion ? 0 : 0.2,
                            ease: "easeOut",
                        }}
                    />

                    <motion.aside
                        initial={shouldReduceMotion ? false : { x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={shouldReduceMotion ? undefined : { x: "-100%" }}
                        transition={{
                            duration: shouldReduceMotion ? 0 : 0.32,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative flex h-full w-[min(22rem,85vw)] flex-col border-r border-border/60 bg-surface p-4 shadow-2xl"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <Link
                                href="/dashboard"
                                onClick={onClose}
                                className="link-clean flex items-center gap-3"
                            >
                                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-border bg-surface shadow-sm">
                                    <Image
                                        src="/logo.png"
                                        alt="Vee's Nail Studio"
                                        fill
                                        sizes="44px"
                                        className="object-cover"
                                    />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold">
                                        Vee&apos;s Nail Studio
                                    </p>
                                    <p className="text-xs text-muted">
                                        Booking Portal
                                    </p>
                                </div>
                            </Link>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close menu"
                                className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 px-3">
                            <p className="flex flex-row items-center gap-1 text-xs text-muted">
                                {`Hello, ${firstName}`}{" "}
                                <CiHeart className="inline-block h-4 w-4 text-pink-main" />
                            </p>
                            <div className="mt-3 border-t border-border/60" />
                        </div>

                        <nav className="mt-6 flex flex-1 flex-col gap-2">
                            {navItems.map((item, index) => (
                                <motion.div
                                    key={item.href}
                                    initial={
                                        shouldReduceMotion
                                            ? false
                                            : { opacity: 0, x: -8 }
                                    }
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: shouldReduceMotion ? 0 : 0.22,
                                        delay: shouldReduceMotion
                                            ? 0
                                            : 0.05 + index * 0.035,
                                        ease: "easeOut",
                                    }}
                                >
                                    <DashboardNavItem
                                        href={item.href}
                                        label={item.label}
                                        icon={item.icon}
                                        onClick={onClose}
                                    />
                                </motion.div>
                            ))}
                        </nav>

                        <div className="space-y-3 border-t border-border/60 pt-4">
                            <div className="rounded-2xl bg-background p-3">
                                <UserAvatar
                                    user={user}
                                    displayName={displayName}
                                />
                            </div>

                            <DashboardNavItem
                                href="/"
                                label="Back to Home"
                                icon={FiHome}
                                onClick={onClose}
                            />

                            <SignOutButton onBeforeSignOut={onClose} />
                        </div>
                    </motion.aside>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
