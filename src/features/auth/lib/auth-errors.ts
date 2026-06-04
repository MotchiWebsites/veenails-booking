export function getFriendlyAuthError(error: unknown): string {
    const message = typeof error === "string" ? error : undefined;
    const normalized = message?.toLowerCase() ?? "";

    if (
        normalized.includes("user already registered") ||
        normalized.includes("already registered") ||
        normalized.includes("already exists")
    ) {
        return "An account with this email already exists. Please sign in instead.";
    }

    if (
        normalized.includes("invalid login credentials") ||
        normalized.includes("invalid credentials")
    ) {
        return "Invalid email or password.";
    }

    if (normalized.includes("email not confirmed")) {
        return "Please confirm your email before signing in.";
    }

    if (normalized.includes("password")) {
        return "Password does not meet the required security rules. Please use at least 8 characters with lowercase, uppercase, a number, and a symbol.";
    }

    if (normalized.includes("rate limit") || normalized.includes("too many")) {
        return "Too many attempts. Please wait a bit and try again.";
    }

    return "Something went wrong. Please try again.";
}
