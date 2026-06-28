"use client";

import AppSelect from "@/components/shared/form/AppSelect";
import type { SlotTimeOption } from "@/features/admin/availability/utils/slot-time-options";

export default function TimeSelect({
    name,
    label,
    value,
    options,
    onChange,
    optional = false,
    disabled = false,
    helperText,
}: {
    name: string;
    label: string;
    value: string;
    options: SlotTimeOption[];
    onChange: (value: string) => void;
    optional?: boolean;
    disabled?: boolean;
    helperText?: string;
}) {
    return (
        <AppSelect
            name={name}
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={optional ? "No end time" : "Choose a time"}
            required={!optional}
            disabled={disabled}
            helperText={helperText}
        />
    );
}
