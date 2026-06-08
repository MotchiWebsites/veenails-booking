"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

export default function AnimatedArrowLink({
    href,
    children,
    className = "btn-primary",
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            whileHover="hover"
            initial="rest"
            animate="rest"
            className="inline-flex"
        >
            <Link href={href} className={className}>
                <span>{children}</span>

                <motion.span
                    variants={{
                        rest: { x: 0 },
                        hover: {
                            x: 6,
                            transition: {
                                type: "tween",
                                duration: 0.9,
                                ease: [0.4, 0, 0.2, 0.2],
                                repeat: Infinity,
                                repeatType: "mirror",
                            },
                        },
                    }}
                    aria-hidden="true"
                    className="inline-flex"
                >
                    <FiArrowRight className="h-4 w-4" />
                </motion.span>
            </Link>
        </motion.div>
    );
}
