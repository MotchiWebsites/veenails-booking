import { routes } from "@/constants/routes";

export function getSafeRedirectPath(value: string | null) {
    if (!value) {
        return routes.dashboard;
    }

    // Must be an internal absolute path.
    if (!value.startsWith("/")) {
        return routes.dashboard;
    }

    // Prevent protocol-relative URLs like //evil.com.
    if (value.startsWith("//")) {
        return routes.dashboard;
    }

    // Prevent encoded/protocol attempts from being used as a redirect target.
    const lowerValue = value.toLowerCase();

    if (
        lowerValue.includes("://") ||
        lowerValue.startsWith("/\\") ||
        lowerValue.includes("%2f%2f") ||
        lowerValue.includes("%5c")
    ) {
        return routes.dashboard;
    }

    return value;
}
