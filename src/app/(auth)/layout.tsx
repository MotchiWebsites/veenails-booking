import Link from "next/link";
import Image from "next/image";
import { FiArrowLeft } from "react-icons/fi";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-6">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="btn-secondary">
                        <FiArrowLeft className="h-4 w-4" />
                        Back Home
                    </Link>

                    <Link
                        href="/"
                        className="link-clean group flex items-center gap-3 rounded-2xl px-2 py-1.5"
                    >
                        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-surface shadow-sm">
                            <Image
                                src="/logo.png"
                                alt="Vee's Nail Studio"
                                fill
                                sizes="40px"
                                className="object-cover"
                                priority
                            />
                        </div>

                        <div className="leading-tight">
                            <p className="text-sm font-semibold transition-colors group-hover:text-pink-main">
                                Vee&apos;s Nail Studio
                            </p>
                            <p className="hidden text-xs text-muted sm:block">
                                Booking Portal
                            </p>
                        </div>
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-center py-10">
                    {children}
                </div>
            </div>
        </main>
    );
}
