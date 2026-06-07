export function getFriendlyAuthError(message?: string) {
    const normalized = message?.toLowerCase() ?? "";
    // reauthentication required when updating sensitive fields (password)
    if (
        normalized.includes("password update requires reauthentication") ||
        normalized.includes("reauthentication required") ||
        normalized.includes("requires reauthentication")
    ) {
        return "For your security, please verify it’s you before changing your password.";
    }

    // same-password error
    if (
        normalized.includes("same password") ||
        normalized.includes("same as the old password") ||
        normalized.includes("different from the old password") ||
        normalized.includes("new password should be different") ||
        normalized.includes("new password must be different") ||
        normalized.includes("should be different")
    ) {
        return "Your new password must be different from your current password.";
    }

    // email already registered
    if (
        normalized.includes("user already registered") ||
        normalized.includes("already registered") ||
        normalized.includes("already been registered") ||
        normalized.includes("already exists") ||
        normalized.includes("email address has already") ||
        normalized.includes("email address is already")
    ) {
        return "An account with this email already exists. Please use a different email.";
    }

    // invalid credentials
    if (
        normalized.includes("invalid login credentials") ||
        normalized.includes("invalid credentials")
    ) {
        return "Invalid email or password.";
    }

    // invalid or expired OTP/token
    if (
        normalized.includes("invalid otp") ||
        normalized.includes("invalid token") ||
        normalized.includes("expired") ||
        normalized.includes("invalid code") ||
        normalized.includes("invalid one-time password") ||
        normalized.includes("token is invalid")
    ) {
        return "That code is invalid or expired. Please check the code or request a new one.";
    }

    // rate limiting
    if (normalized.includes("rate limit") || normalized.includes("too many") || normalized.includes("too many requests")) {
        return "Too many attempts. Please wait a bit before trying again.";
    }

    // password policy (fallback)
    if (normalized.includes("password")) {
        return "Password does not meet the required security rules. Please use at least 8 characters with lowercase, uppercase, a number, and a symbol.";
    }

    // email related fallback
    if (normalized.includes("email")) {
        return "Could not update this email. Please check the address and try again.";
    }

    return "Something went wrong. Please try again.";
}
