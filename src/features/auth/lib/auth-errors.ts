type AuthErrorLike = {
    code?: string;
    message?: string;
    name?: string;
    status?: number;
};

function asAuthError(error?: unknown): AuthErrorLike {
    if (typeof error === "string") {
        return { message: error };
    }

    if (!error || typeof error !== "object") {
        return {};
    }

    const candidate = error as Record<string, unknown>;

    return {
        code:
            typeof candidate.code === "string" ? candidate.code : undefined,
        message:
            typeof candidate.message === "string"
                ? candidate.message
                : undefined,
        name:
            typeof candidate.name === "string" ? candidate.name : undefined,
        status:
            typeof candidate.status === "number"
                ? candidate.status
                : undefined,
    };
}

export function isSessionAuthError(error?: unknown) {
    const details = asAuthError(error);
    const normalized = details.message?.toLowerCase() ?? "";

    return (
        details.code === "refresh_token_not_found" ||
        details.code === "refresh_token_already_used" ||
        details.code === "session_not_found" ||
        details.code === "session_expired" ||
        normalized.includes("invalid refresh token") ||
        normalized.includes("refresh token is not valid") ||
        normalized.includes("refresh token not found") ||
        normalized.includes("refresh token already used")
    );
}

export function isPkceAuthError(error?: unknown) {
    const details = asAuthError(error);
    const normalized = details.message?.toLowerCase() ?? "";

    return (
        details.code === "pkce_code_verifier_not_found" ||
        details.code === "bad_code_verifier" ||
        details.code === "flow_state_not_found" ||
        details.code === "flow_state_expired" ||
        normalized.includes("code verifier") ||
        normalized.includes("pkce")
    );
}

export function getAuthErrorLogDetails(error?: unknown) {
    const details = asAuthError(error);

    return {
        name: details.name ?? "UnknownAuthError",
        code: details.code ?? "unknown",
        status: details.status ?? null,
        message: details.message ?? "Unknown authentication error",
    };
}

export function getFriendlyAuthError(error?: unknown, fallbackCode?: string) {
    const details = asAuthError(error);
    const normalized = details.message?.toLowerCase() ?? "";

    if (isSessionAuthError(error)) {
        return "Your saved sign-in session expired. Refresh the page and try again. If it continues, clear this site’s saved data. (Code: AUTH-SESSION)";
    }

    if (
        details.code === "flow_state_not_found" ||
        details.code === "flow_state_expired" ||
        details.code === "bad_oauth_state" ||
        details.code === "bad_oauth_callback"
    ) {
        return "This sign-in link is no longer valid. Start again from the sign-in page. (Code: AUTH-CALLBACK)";
    }

    if (
        details.code === "unexpected_failure" &&
        normalized.includes("database error")
    ) {
        return "We couldn’t finish setting up your account. Please try again. If it continues, share code AUTH-DATABASE.";
    }

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
    if (
        normalized.includes("rate limit") ||
        normalized.includes("too many") ||
        normalized.includes("too many requests")
    ) {
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

    // current password required or incorrect (fallback)
    if (
        normalized.includes("current password required") ||
        normalized.includes("current_password") ||
        normalized.includes("current password is required")
    ) {
        return "Please enter your current password to change your password.";
    }

    if (
        normalized.includes("invalid current password") ||
        normalized.includes("incorrect current password") ||
        normalized.includes("current password is incorrect")
    ) {
        return "Your current password is incorrect.";
    }

    return fallbackCode
        ? `Something went wrong. Please try again. (Code: ${fallbackCode})`
        : "Something went wrong. Please try again.";
}
