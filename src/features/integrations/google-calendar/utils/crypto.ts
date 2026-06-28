import "server-only";

import {
    createCipheriv,
    createDecipheriv,
    createHmac,
    createHash,
    randomBytes,
    timingSafeEqual,
} from "node:crypto";
import { requireGoogleCalendarConfig } from "@/features/integrations/google-calendar/utils/config";

function key() {
    return createHash("sha256")
        .update(requireGoogleCalendarConfig().encryptionKey)
        .digest();
}

export function encryptGoogleRefreshToken(token: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key(), iv);
    const encrypted = Buffer.concat([
        cipher.update(token, "utf8"),
        cipher.final(),
    ]);
    return [
        "v1",
        iv.toString("base64url"),
        cipher.getAuthTag().toString("base64url"),
        encrypted.toString("base64url"),
    ].join(".");
}

export function decryptGoogleRefreshToken(value: string) {
    const [version, iv, tag, encrypted] = value.split(".");
    if (version !== "v1" || !iv || !tag || !encrypted) {
        throw new Error("Stored Google authorization is invalid.");
    }
    const decipher = createDecipheriv(
        "aes-256-gcm",
        key(),
        Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
        decipher.update(Buffer.from(encrypted, "base64url")),
        decipher.final(),
    ]).toString("utf8");
}

type OAuthState = {
    adminUserId: string;
    expiresAt: number;
    nonce: string;
};

export function createGoogleOAuthState(adminUserId: string) {
    const payload: OAuthState = {
        adminUserId,
        expiresAt: Date.now() + 10 * 60 * 1000,
        nonce: randomBytes(18).toString("base64url"),
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", key()).update(encoded).digest("base64url");
    return `${encoded}.${signature}`;
}

export function verifyGoogleOAuthState(
    state: string,
    authenticatedUserId: string,
) {
    const [encoded, signature] = state.split(".");
    if (!encoded || !signature) return false;
    const expected = createHmac("sha256", key()).update(encoded).digest();
    const received = Buffer.from(signature, "base64url");
    if (
        expected.length !== received.length ||
        !timingSafeEqual(expected, received)
    ) {
        return false;
    }
    try {
        const payload = JSON.parse(
            Buffer.from(encoded, "base64url").toString("utf8"),
        ) as OAuthState;
        return (
            payload.adminUserId === authenticatedUserId &&
            payload.expiresAt > Date.now() &&
            typeof payload.nonce === "string"
        );
    } catch {
        return false;
    }
}
