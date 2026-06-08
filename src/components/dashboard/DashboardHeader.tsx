"use client";

import type { User } from "@supabase/supabase-js";
import { FiMenu } from "react-icons/fi";
import DashboardUserMenu from "@/components/dashboard/DashboardUserMenu";
import Link from "next/link";

function getDisplayName(user: User) {
    return (
        user.user_metadata?.full_name ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Client"
    );
}

export default function DashboardHeader({
    user,
    onOpenMobileSidebar,
}: {
    user: User;
    onOpenMobileSidebar: () => void;
}) {
    const displayName = getDisplayName(user);

    return (
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={onOpenMobileSidebar}
                        aria-label="Open navigation"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden"
                    >
                        <FiMenu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0">
                        <Link
                            href="/dashboard"
                            className="hidden text-xs space-y-1 font-semibold tracking-wide text-muted sm:block"
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                Booking Portal
                            </p>
                            <h1 className="truncate text-base font-semibold sm:text-xl">
                                {displayName
                                    ? `${displayName}'s Dashboard`
                                    : "Your Dashboard"}
                            </h1>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <DashboardUserMenu user={user} />
                </div>
            </div>
        </header>
    );
}
