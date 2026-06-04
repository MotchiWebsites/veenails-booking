"use client";

function getFocusableFields(form: HTMLFormElement) {
    return Array.from(
        form.querySelectorAll<HTMLElement>(
            [
                "input:not([type='hidden']):not([disabled])",
                "select:not([disabled])",
                "textarea:not([disabled])",
            ].join(", "),
        ),
    ).filter((element) => element.tabIndex !== -1);
}

export default function AppForm({
    children,
    action,
    className = "",
}: {
    children: React.ReactNode;
    action?: (formData: FormData) => void | Promise<void>;
    className?: string;
}) {
    return (
        <form
            action={action}
            className={`space-y-4 ${className}`}
            onKeyDown={(event) => {
                if (event.key !== "Enter") return;

                const target = event.target as HTMLElement;
                const behavior = target.dataset.enterBehavior;

                if (behavior !== "next") return;

                const form = event.currentTarget;
                const fields = getFocusableFields(form);
                const currentIndex = fields.indexOf(target);

                if (currentIndex === -1) return;

                const nextField = fields[currentIndex + 1];

                if (!nextField) return;

                event.preventDefault();
                nextField.focus();
            }}
        >
            {children}
        </form>
    );
}
