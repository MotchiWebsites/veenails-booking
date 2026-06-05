"use client";

import Link from "next/link";
import React from "react";
import {
    FiCheckCircle,
    FiAlertTriangle,
    FiAlertCircle,
    FiInfo,
} from "react-icons/fi";

const variantMap: Record<
    string,
    { icon: React.ElementType; wrapper: string; color: string }
> = {
    success: {
        icon: FiCheckCircle,
        wrapper: "border-success/25 bg-success-soft text-success",
        color: "success",
    },
    warning: {
        icon: FiAlertTriangle,
        wrapper: "border-warning/25 bg-warning-soft text-warning",
        color: "warning",
    },
    error: {
        icon: FiAlertCircle,
        wrapper: "border-danger/25 bg-danger-soft text-danger",
        color: "danger",
    },
    info: {
        icon: FiInfo,
        wrapper: "border-info/25 bg-info-soft text-info",
        color: "info",
    },
};

export default function AuthResultScreen({
    variant = "info",
    title,
    description,
    primaryActionLabel,
    primaryActionHref,
    secondaryActionLabel,
    secondaryActionHref,
    icon,
}: {
    variant?: "success" | "warning" | "error" | "info";
    title: string;
    description?: React.ReactNode;
    primaryActionLabel?: string;
    primaryActionHref?: string;
    secondaryActionLabel?: string;
    secondaryActionHref?: string;
    icon?: React.ReactNode;
}) {
    const styles = variantMap[variant] || variantMap.info;
    const Icon = styles.icon;

    return (
        <div className={`space-y-6 text-center ${styles.wrapper} rounded-2xl border p-6`}> 
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/30">
                {icon ? (
                    <span className="h-7 w-7 inline-flex items-center justify-center">{icon}</span>
                ) : (
                    <Icon className="h-7 w-7" />
                )}
            </div>

            <h3 className="text-base font-semibold">{title}</h3>

            {description ? (
                <p className="text-sm leading-relaxed text-muted max-w-prose mx-auto">
                    {description}
                </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                {primaryActionHref && primaryActionLabel ? (
                    <Link href={primaryActionHref} className="btn-primary w-full sm:w-auto">
                        {primaryActionLabel}
                    </Link>
                ) : null}

                {secondaryActionHref && secondaryActionLabel ? (
                    <Link href={secondaryActionHref} className="btn-secondary w-full sm:w-auto">
                        {secondaryActionLabel}
                    </Link>
                ) : null}

                {!primaryActionHref && !secondaryActionHref ? (
                    <Link href="/" className="btn-ghost w-full sm:w-auto">
                        Home
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
