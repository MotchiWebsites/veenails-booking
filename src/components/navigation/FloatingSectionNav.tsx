"use client";

import { useEffect, useState } from "react";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";

type SectionItem = {
    id: string;
    label: string;
};

export default function FloatingSectionNav({
    items,
}: {
    items: SectionItem[];
}) {
    const [activeId, setActiveId] = useState(items[0]?.id ?? "");
    const [isOpen, setIsOpen] = useState(false);
    const [showHandle, setShowHandle] = useState(false);

    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        const isMobile = window.innerWidth < 768;

        items.forEach((item) => {
            const el = document.getElementById(item.id);
            if (!el) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setActiveId(item.id);
                    }
                },
                {
                    rootMargin: isMobile
                        ? "-20% 0px -60% 0px"
                        : "-35% 0px -45% 0px",
                    threshold: isMobile ? 0 : 0.1,
                },
            );

            observer.observe(el);
            observers.push(observer);
        });

        return () => {
            observers.forEach((observer) => observer.disconnect());
        };
    }, [items]);

    useEffect(() => {
        const onScroll = () => {
            setShowHandle(window.scrollY > 350);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;

        const top = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({
            top,
            behavior: "smooth",
        });
        setIsOpen(false);
    };

    return (
        <div
            className={`fixed right-0 top-1/2 z-40 -translate-y-1/2 transition-all duration-500 ease-out ${
                showHandle
                    ? "translate-x-0 opacity-100"
                    : "translate-x-6 opacity-0"
            }`}
        >
            <div
                aria-hidden={!showHandle}
                className={[
                    "flex items-stretch overflow-hidden rounded-l-2xl border-2 border-border/60 bg-surface shadow-lg shadow-pink-100/30 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    showHandle ? "pointer-events-auto" : "pointer-events-none",
                    isOpen ? "w-56" : "w-7 sm:w-9",
                ].join(" ")}
            >
                <button
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    aria-expanded={isOpen}
                    aria-label={
                        isOpen
                            ? "Collapse section navigation"
                            : "Expand section navigation"
                    }
                    className={[
                        "flex shrink-0 items-center justify-center rounded-l-full bg-surface text-muted transition-colors duration-300 hover:bg-surface-2 hover:text-foreground sm:rounded-none",
                        isOpen ? "w-7 border-r border-border/50" : "w-7 sm:w-9 border-r-0",
                    ].join(" ")}
                    tabIndex={showHandle ? 0 : -1}
                >
                    <span
                        aria-hidden="true"
                        className="text-sm leading-none transition-transform duration-500 text-pink-main"
                    >
                        {isOpen ? (
                            <IoMdArrowDropright className="text-3xl sm:text-4xl" />
                        ) : (
                            <IoMdArrowDropleft className="text-3xl sm:text-4xl" />
                        )}
                    </span>
                </button>

                <div
                    className={[
                        "min-w-0 bg-surface flex-1 p-2 sm:p-3 transition-opacity duration-300",
                        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
                    ].join(" ")}
                >
                    <div className="flex max-h-[60vh] max-w-full flex-col gap-2 overflow-y-auto pr-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {items.map((item) => {
                            const active = activeId === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => scrollToSection(item.id)}
                                    className={[
                                        "w-full shadow-sm border border-border rounded-xl px-3 py-2 text-left text-sm font-medium transition-all duration-300",
                                        active
                                            ? "bg-pink-main text-white shadow-sm shadow-pink-200/60"
                                            : "bg-pink-50/80 text-muted hover:bg-pink-100 hover:text-foreground",
                                    ].join(" ")}
                                    tabIndex={showHandle ? 0 : -1}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
