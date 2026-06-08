import Image from "next/image";
import Link from "next/link";

export default function PublicNavbar({
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
    className = "",
}: {
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
    className?: string;
}) {
    return (
        <header className={`sticky top-0 z-40 backdrop-blur-sm bg-surface/80 border-b border-border/30 shadow-sm px-5 py-4 sm:px-6 ${className}`}>
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                <Link
                    href="/"
                    className="link-clean group flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-surface/70"
                >
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border bg-surface shadow-sm sm:h-11 sm:w-11">
                        <Image
                            src="/logo.png"
                            alt="Vee's Nail Studio"
                            fill
                            sizes="500px"
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

                <nav className="flex items-center gap-2">
                    {/* Mobile menu button */}
                    <Link
                        href={secondaryHref}
                        className="btn-primary sm:hidden"
                    >
                        {secondaryLabel}
                    </Link>

                    {/* Desktop menu items */}
                    <Link
                        href={secondaryHref}
                        className="btn-secondary hidden sm:inline-flex"
                    >
                        {secondaryLabel}
                    </Link>

                    <Link
                        href={primaryHref}
                        className="btn-primary hidden sm:inline-flex"
                    >
                        {primaryLabel}
                    </Link>
                </nav>
            </div>
        </header>
    );
}
