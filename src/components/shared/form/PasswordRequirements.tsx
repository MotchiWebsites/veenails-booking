"use client";

import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import {
    getPasswordStatus,
    getPasswordStrength,
} from "@/features/auth/validation/password";

export default function PasswordRequirements({
    password,
    showStrength = true,
}: {
    password: string;
    showStrength?: boolean;
}) {
    const requirements = getPasswordStatus(password);
    const strength = getPasswordStrength(password);

    return (
        <div className="space-y-4">
            <ul className="space-y-2">
                {requirements.map((requirement) => (
                    <li
                        key={requirement.id}
                        className="flex items-center gap-2 text-xs"
                    >
                        {requirement.met ? (
                            <FiCheckCircle className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                            <FiXCircle className="h-4 w-4 shrink-0 text-muted-2" />
                        )}

                        <span
                            className={
                                requirement.met
                                    ? "text-foreground"
                                    : "text-muted"
                            }
                        >
                            {requirement.label}
                        </span>
                    </li>
                ))}
            </ul>

            {showStrength ? (
                <div>
                    <div className="flex items-center justify-between gap-3 ">
                        <span className="font-semibold text-foreground">
                            Password strength
                        </span>
                        <span className="text-muted">{strength.label}</span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-background border border-border">
                        <div
                            className="h-full rounded-full bg-pink-main transition-all duration-300"
                            style={{ width: `${strength.percent}%` }}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
