import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/features/auth/lib/redirects";
import { isAdminUser } from "@/features/admin/auth/admin-auth";
import {
    getAuthErrorLogDetails,
    isPkceAuthError,
    isSessionAuthError,
} from "@/features/auth/lib/auth-errors";
import { routes } from "@/constants/routes";

type CallbackErrorReason =
    | "callback"
    | "expired"
    | "missing"
    | "pkce"
    | "provider"
    | "session";

type EmailOtpType =
    | "email"
    | "email_change"
    | "invite"
    | "magiclink"
    | "recovery"
    | "signup";

function getEmailOtpType(value: string | null): EmailOtpType | null {
    const allowedTypes: EmailOtpType[] = [
        "email",
        "email_change",
        "invite",
        "magiclink",
        "recovery",
        "signup",
    ];

    return allowedTypes.includes(value as EmailOtpType)
        ? (value as EmailOtpType)
        : null;
}

function getLoginErrorUrl(
    request: NextRequest,
    reason: CallbackErrorReason,
    isRecovery: boolean,
) {
    const url = new URL(
        isRecovery ? routes.forgotPassword : routes.login,
        request.url,
    );
    url.searchParams.set("authError", reason);
    return url;
}

function getRedirectErrorReason(code: string | null, message: string) {
    const normalized = message.toLowerCase();
    const error = { code: code ?? undefined, message };

    if (
        code === "otp_expired" ||
        normalized.includes("expired") ||
        normalized.includes("invalid")
    ) {
        return "expired" satisfies CallbackErrorReason;
    }

    if (isSessionAuthError(error)) {
        return "session" satisfies CallbackErrorReason;
    }

    if (isPkceAuthError(error)) {
        return "pkce" satisfies CallbackErrorReason;
    }

    return "provider" satisfies CallbackErrorReason;
}

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const tokenHash = requestUrl.searchParams.get("token_hash");
    const tokenType = getEmailOtpType(requestUrl.searchParams.get("type"));
    const hasCodeVerifier = request.cookies
        .getAll()
        .some(({ name }) => name.endsWith("-code-verifier"));
    const providerError =
        requestUrl.searchParams.get("error_description") ??
        requestUrl.searchParams.get("error");
    const providerErrorCode = requestUrl.searchParams.get("error_code");
    const requestedNext = requestUrl.searchParams.get("next");
    const isRecovery =
        tokenType === "recovery" || requestedNext === routes.resetPassword;
    let next = getSafeRedirectPath(requestedNext);

    if (providerError) {
        const reason = getRedirectErrorReason(
            providerErrorCode,
            providerError,
        );
        console.warn("[auth-callback] Authentication redirect returned an error", {
            code: providerErrorCode,
            message: providerError,
            reason,
            isRecovery,
        });
        return NextResponse.redirect(
            getLoginErrorUrl(request, reason, isRecovery),
        );
    }

    if (!code && !(tokenHash && tokenType)) {
        console.warn("[auth-callback] Callback credentials were missing", {
            hasCode: Boolean(code),
            hasTokenHash: Boolean(tokenHash),
            tokenType: requestUrl.searchParams.get("type"),
        });
        return NextResponse.redirect(
            getLoginErrorUrl(request, "missing", isRecovery),
        );
    }

    try {
        const supabase = await createClient();
        const { error } =
            tokenHash && tokenType
                ? await supabase.auth.verifyOtp({
                      token_hash: tokenHash,
                      type: tokenType,
                  })
                : await supabase.auth.exchangeCodeForSession(code!);

        if (error) {
            console.warn(
                "[auth-callback] Code exchange failed",
                {
                    ...getAuthErrorLogDetails(error),
                    flow: tokenHash ? "token_hash" : "pkce",
                    hasCodeVerifier,
                },
            );
            return NextResponse.redirect(
                getLoginErrorUrl(
                    request,
                    isSessionAuthError(error)
                        ? "session"
                        : isPkceAuthError(error)
                          ? "pkce"
                          : tokenHash
                            ? "expired"
                            : "callback",
                    isRecovery,
                ),
            );
        }

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            console.warn(
                "[auth-callback] Session verification failed",
                getAuthErrorLogDetails(userError),
            );
            return NextResponse.redirect(
                getLoginErrorUrl(
                    request,
                    isSessionAuthError(userError) ? "session" : "callback",
                    isRecovery,
                ),
            );
        }

        if (!requestedNext) {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("profile_completed_at")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) {
                console.error("[auth-callback] Profile lookup failed", {
                    userId: user.id,
                    code: profileError.code,
                    message: profileError.message,
                });
                next = routes.completeProfile;
            } else if (!profile?.profile_completed_at) {
                next = routes.completeProfile;
            } else if (await isAdminUser(user.id)) {
                next = routes.admin;
            }
        }
    } catch (error) {
        console.error(
            "[auth-callback] Unexpected callback failure",
            getAuthErrorLogDetails(error),
        );
        return NextResponse.redirect(
            getLoginErrorUrl(
                request,
                isSessionAuthError(error) ? "session" : "callback",
                isRecovery,
            ),
        );
    }

    return NextResponse.redirect(new URL(next, request.url));
}
