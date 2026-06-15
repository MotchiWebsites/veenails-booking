"use client";

import { FiChevronDown } from "react-icons/fi";

type SelectOption = {
    label: string;
    value: string;
    disabled?: boolean;
};

type AppSelectProps = {
    id?: string;
    name?: string;
    label?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    helperText?: string;
    required?: boolean;
    className?: string;
    fullWidth?: boolean;
    "aria-label"?: string;
};

export default function AppSelect({
    id,
    name,
    label,
    value,
    defaultValue,
    onChange,
    options,
    placeholder,
    disabled = false,
    error,
    helperText,
    required = false,
    className = "",
    fullWidth = true,
    ...ariaProps
}: AppSelectProps) {
    const baseId = id ?? name ?? "app-select";
    const helpId = helperText ? `${baseId}-help` : undefined;
    const errorId = error ? `${baseId}-error` : undefined;

    return (
        <label
            className={["block", fullWidth ? "w-full" : "", className]
                .filter(Boolean)
                .join(" ")}
        >
            {label ? (
                <span className="text-sm lg:text-base font-semibold text-foreground">
                    {label} {required && (<span className="text-danger">*</span>)}
                </span>
            ) : null}

            <div className="relative mt-2">
                <select
                    id={id}
                    name={name}
                    value={value}
                    defaultValue={defaultValue}
                    onChange={
                        onChange
                            ? (event) => onChange(event.target.value)
                            : undefined
                    }
                    disabled={disabled}
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                        [helpId, errorId].filter(Boolean).join(" ") || undefined
                    }
                    className={[
                        "w-full appearance-none rounded-2xl border bg-background px-4 py-3 pr-11 text-sm text-foreground outline-none transition",
                        "border-border/60 focus:border-pink-main focus:ring-2 focus:ring-pink-main/20",
                        disabled ? "cursor-not-allowed opacity-60" : "",
                        error
                            ? "border-danger/50 focus:border-danger focus:ring-danger/20"
                            : "",
                    ].join(" ")}
                    {...ariaProps}
                >
                    {placeholder ? (
                        <option value="">{placeholder}</option>
                    ) : null}

                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                <FiChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                />
            </div>

            {helperText ? (
                <p
                    id={helpId}
                    className="mt-2 text-xs leading-relaxed text-muted"
                >
                    {helperText}
                </p>
            ) : null}

            {error ? (
                <p id={errorId} className="mt-2 text-xs text-danger">
                    {error}
                </p>
            ) : null}
        </label>
    );
}
