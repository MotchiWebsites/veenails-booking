export type PasswordRequirement = {
    id: string;
    label: string;
    test: (password: string) => boolean;
};

export const passwordRequirements: PasswordRequirement[] = [
    {
        id: "length",
        label: "At least 8 characters",
        test: (password) => password.length >= 8,
    },
    {
        id: "lowercase",
        label: "One lowercase letter",
        test: (password) => /[a-z]/.test(password),
    },
    {
        id: "uppercase",
        label: "One uppercase letter",
        test: (password) => /[A-Z]/.test(password),
    },
    {
        id: "number",
        label: "One number",
        test: (password) => /\d/.test(password),
    },
    {
        id: "symbol",
        label: "One symbol",
        test: (password) => /[^A-Za-z0-9]/.test(password),
    },
];

export function getPasswordStatus(password: string) {
    return passwordRequirements.map((requirement) => ({
        ...requirement,
        met: requirement.test(password),
    }));
}

export function isValidPassword(password: string) {
    return getPasswordStatus(password).every((requirement) => requirement.met);
}

export function getPasswordIssues(password: string) {
    return getPasswordStatus(password).filter(
        (requirement) => !requirement.met,
    );
}

export function getPasswordErrorMessage(password: string) {
    const issues = getPasswordIssues(password);

    if (issues.length === 0) return null;

    return `Password must include: ${issues
        .map((issue) => issue.label.toLowerCase())
        .join(", ")}.`;
}

export function getPasswordStrength(password: string) {
    const status = getPasswordStatus(password);
    const metCount = status.filter((item) => item.met).length;

    if (!password) {
        return {
            label: "Not started",
            percent: 0,
        };
    }

    const length = password.length;
    const hasLowercase = status.some((item) => item.id === "lowercase" && item.met);
    const hasUppercase = status.some((item) => item.id === "uppercase" && item.met);
    const hasNumber = status.some((item) => item.id === "number" && item.met);
    const hasSymbol = status.some((item) => item.id === "symbol" && item.met);
    const hasRepeatedChars = /(.)\1{2,}/.test(password);
    const hasCommonPattern = /1234|2345|abcd|qwer/i.test(password);
    const hasCommonWeakWord = /password|admin|welcome|letmein|iloveyou/i.test(password);
    const varietyCount = [hasLowercase, hasUppercase, hasNumber, hasSymbol].filter(Boolean).length;

    let score = 0;

    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    score += Math.min(varietyCount, 4);
    if (hasSymbol) score += 1;
    if (length >= 20) score += 1;

    if (hasRepeatedChars) score -= 1;
    if (hasCommonPattern) score -= 1;
    if (hasCommonWeakWord) score -= 2;

    if (score <= 2 || metCount <= 1) {
        return {
            label: "Weak",
            percent: 25,
        };
    }

    if (score <= 5) {
        return {
            label: "Fair",
            percent: 50,
        };
    }

    return {
        label: "Strong",
        percent: 100,
    };
}
