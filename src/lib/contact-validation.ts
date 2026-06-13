export const MIN_NAME_LENGTH = 2;
export const MIN_MESSAGE_LENGTH = 10;
export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_MESSAGE_LENGTH = 2000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactFormData = {
    from_name: string;
    from_email: string;
    message: string;
};

export type ContactValidationResult =
    | { ok: true; data: ContactFormData }
    | { ok: false; errors: Partial<Record<keyof ContactFormData | "form", string>> };

/** Strip newlines/control chars from single-line fields to reduce header-injection risk. */
const sanitizeSingleLine = (value: string) =>
    value.replace(/[\r\n\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim();

export const validateContactForm = (input: unknown): ContactValidationResult => {
    if (!input || typeof input !== "object") {
        return { ok: false, errors: { form: "Invalid request body." } };
    }

    const body = input as Record<string, unknown>;
    const from_name = sanitizeSingleLine(String(body.from_name ?? ""));
    const from_email = sanitizeSingleLine(String(body.from_email ?? ""));
    const message = String(body.message ?? "").trim();

    const errors: Partial<Record<keyof ContactFormData, string>> = {};

    if (from_name.length < MIN_NAME_LENGTH) {
        errors.from_name = `Name must be at least ${MIN_NAME_LENGTH} characters.`;
    } else if (from_name.length > MAX_NAME_LENGTH) {
        errors.from_name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
    }

    if (!from_email) {
        errors.from_email = "Email is required.";
    } else if (from_email.length > MAX_EMAIL_LENGTH) {
        errors.from_email = `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`;
    } else if (!EMAIL_PATTERN.test(from_email)) {
        errors.from_email = "Enter a valid email address.";
    }

    if (message.length < MIN_MESSAGE_LENGTH) {
        errors.message = `Message must be at least ${MIN_MESSAGE_LENGTH} characters.`;
    } else if (message.length > MAX_MESSAGE_LENGTH) {
        errors.message = `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    return {
        ok: true,
        data: { from_name, from_email, message },
    };
};
