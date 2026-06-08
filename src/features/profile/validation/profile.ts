import { isValidEmail } from "@/features/auth/validation/email";
import {
    getPasswordErrorMessage,
    isValidPassword,
} from "@/features/auth/validation/password";
import {
    isCompleteNorthAmericanPhone,
    normalizeNorthAmericanPhone,
} from "@/features/auth/validation/phone";

export function validateDisplayName(value: string) {
    const displayName = value.trim();

    if (!displayName) {
        return "Please enter your name.";
    }

    if (displayName.length < 2) {
        return "Name must be at least 2 characters.";
    }

    if (displayName.length > 80) {
        return "Name must be 80 characters or less.";
    }

    return null;
}

export function validateProfilePhone(value: string) {
    const phone = value.trim();

    if (!phone) {
        return null;
    }

    if (!isCompleteNorthAmericanPhone(phone)) {
        return "Please enter a valid 10-digit phone number.";
    }

    return null;
}

export function normalizeProfilePhone(value: string) {
    const phone = value.trim();

    if (!phone) {
        return null;
    }

    return normalizeNorthAmericanPhone(phone);
}

export function validateProfileEmail(value: string, currentEmail?: string) {
    const email = value.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
        return "Enter a valid email address.";
    }

    if (currentEmail && email === currentEmail.trim().toLowerCase()) {
        return "New email must be different from your current email.";
    }

    return null;
}

export function validateProfilePassword(value: string) {
    return getPasswordErrorMessage(value);
}

export { isValidEmail, isValidPassword };
