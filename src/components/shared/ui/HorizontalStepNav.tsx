"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export default function HorizontalStepNav<TItem>({
    items,
    activeKey,
    getKey,
    renderItem,
    sectionClassName = "",
    listClassName = "",
    itemClassName = "",
}: {
    items: readonly TItem[];
    activeKey: string;
    getKey: (item: TItem) => string;
    renderItem: (item: TItem, index: number) => ReactNode;
    sectionClassName?: string;
    listClassName?: string;
    itemClassName?: string;
}) {
    const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        itemRefs.current[activeKey]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        });
    }, [activeKey]);

    return (
        <section
            className={[
                "rounded-3xl border border-border/60 bg-surface p-3 shadow-sm sm:p-4",
                sectionClassName,
            ].join(" ")}
        >
            <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
                <ol className={["flex min-w-max gap-3", listClassName].join(" ")}>
                    {items.map((item, index) => {
                        const key = getKey(item);

                        return (
                            <li
                                key={key}
                                ref={(el) => {
                                    itemRefs.current[key] = el;
                                }}
                                className={itemClassName}
                            >
                                {renderItem(item, index)}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
