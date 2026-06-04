"use client";

import { motion, useReducedMotion } from "framer-motion";

type RevealProps = {
    children: React.ReactNode;
    className?: string;
    delay?: number;
};

export default function Reveal({
    children,
    className = "",
    delay = 0,
}: RevealProps) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={
                shouldReduceMotion
                    ? false
                    : {
                          opacity: 0,
                          y: 36,
                          scale: 0.975,
                      }
            }
            whileInView={
                shouldReduceMotion
                    ? undefined
                    : {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                      }
            }
            viewport={{ once: true, amount: 0.15 }}
            transition={{
                duration: 1.5,
                delay,
                ease: [0.16, 1, 0.3, 1],
            }}
        >
            {children}
        </motion.div>
    );
}
