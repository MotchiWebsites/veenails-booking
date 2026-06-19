"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import DashboardSidebar from "@/components/navigation/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileSidebar from "@/components/navigation/dashboard/MobileSidebar";

export default function DashboardShell({
    user,
    isAdmin,
    children,
}: {
    user: User;
    isAdmin: boolean;
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <MobileSidebar
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                user={user}
            />

            <div className="flex min-h-screen">
                <DashboardSidebar
                    user={user}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed((value) => !value)}
                />

                <div className="flex min-w-0 flex-1 flex-col">
                    <DashboardHeader
                        user={user}
                        isAdmin={isAdmin}
                        onOpenMobileSidebar={() => setMobileOpen(true)}
                    />

                    <main className="flex-1 px-5 py-6 sm:px-6 lg:px-8">
                        <div className="mx-auto w-full max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
