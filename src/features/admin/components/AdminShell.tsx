import Link from "next/link";
import { FiCalendar, FiClock, FiHome, FiSettings, FiUsers } from "react-icons/fi";
import AdminViewToggle from "@/components/shared/navigation/AdminViewToggle";

const navItems = [
    { href: "/admin", label: "Overview", icon: FiHome },
    { href: "/admin/appointments", label: "Appointments", icon: FiCalendar },
    { href: "/admin/availability", label: "Availability", icon: FiClock },
    { href: "/admin/users", label: "Users", icon: FiUsers },
    { href: "/admin/settings", label: "Settings", icon: FiSettings },
];

export default function AdminShell({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border/60 bg-surface">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-dark-green">
                            Vee&apos;s Nail Studio
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                            Admin
                        </p>
                    </div>
                    <nav className="flex gap-2 overflow-x-auto pb-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-dark-green/40 hover:text-dark-green"
                                >
                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <AdminViewToggle isAdmin className="lg:shrink-0" />
                </div>
            </header>
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
