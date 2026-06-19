"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function AnimatedStepPanel({
    panelKey,
    shouldReduceMotion,
    variant = "standard",
    children,
}: {
    panelKey: string;
    shouldReduceMotion: boolean | null;
    variant?: "standard" | "review";
    children: ReactNode;
}) {
    const review = variant === "review";

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={panelKey}
                initial={
                    shouldReduceMotion
                        ? false
                        : {
                              opacity: 0,
                              y: review ? 24 : 14,
                              scale: review ? 0.985 : 0.995,
                          }
                }
                animate={
                    shouldReduceMotion
                        ? undefined
                        : {
                              opacity: 1,
                              y: 0,
                              scale: 1,
                          }
                }
                exit={
                    shouldReduceMotion
                        ? undefined
                        : {
                              opacity: 0,
                              y: -10,
                              scale: 0.995,
                          }
                }
                transition={{
                    duration: review ? 0.32 : 0.24,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
