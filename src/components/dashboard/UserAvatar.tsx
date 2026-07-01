import type { User } from "@supabase/supabase-js";
import { FiUser } from "react-icons/fi";

export default function UserAvatar({
    user,
    displayName,
    showText = true,
    showGreeting = false,
}: {
    user: User;
    displayName: string;
    showText?: boolean;
    showGreeting?: boolean;
}) {
    const firstName = String(displayName).split(" ")[0];
    const initial = String(displayName).charAt(0).toUpperCase();

    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-sm font-semibold text-pink-main shadow-sm">
                {initial || <FiUser className="h-4 w-4" />}
            </div>

            {showText ? (
                <div className="min-w-0">
                    {showGreeting ? (
                        <p className="truncate text-xs text-muted">{`Hello, ${firstName}!`}</p>
                    ) : null}

                    <p className="truncate text-sm font-semibold text-foreground">
                        {displayName}
                    </p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
            ) : null}
        </div>
    );
}
