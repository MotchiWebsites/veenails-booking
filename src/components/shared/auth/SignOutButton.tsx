import { CiLogout } from "react-icons/ci";
import AppForm from "@/components/shared/form/AppForm";
import { signOut } from "@/features/auth/actions/auth";

type SignOutButtonVariant = "nav" | "button";

type SignOutButtonProps = {
    collapsed?: boolean;
    onBeforeSignOut?: () => void;
    className?: string;
    iconClassName?: string;
    label?: string;
    variant?: SignOutButtonVariant;
};

const baseButtonClasses =
    "group flex w-full items-center gap-3 rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const variantClasses: Record<SignOutButtonVariant, string> = {
    nav: "px-3 py-3 text-muted hover:bg-surface-2 hover:text-foreground",
    button: "btn-secondary",
};

export default function SignOutButton({
    collapsed = false,
    onBeforeSignOut,
    className = "",
    iconClassName = "",
    label = "Sign Out",
    variant = "nav",
}: SignOutButtonProps) {
    return (
        <AppForm action={signOut}>
            <button
                type="submit"
                onClick={onBeforeSignOut}
                aria-label={label}
                className={[
                    baseButtonClasses,
                    variantClasses[variant],
                    collapsed ? "justify-center" : "",
                    className,
                ].join(" ")}
            >
                <CiLogout
                    className={[
                        "h-5 w-5 shrink-0",
                        "text-foreground font-medium transition-colors group-hover:text-pink-main duration-300",
                        iconClassName,
                    ].join(" ")}
                    aria-hidden="true"
                />

                {!collapsed ? <span>{label}</span> : null}
            </button>
        </AppForm>
    );
}
