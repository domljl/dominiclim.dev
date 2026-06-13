import emailjs from "@emailjs/browser";

export const socialLinks = {
    email: "mailto:domljl07@gmail.com",
    github: "https://github.com/domljl",
    linkedin: "https://www.linkedin.com/in/domljl/",
} as const;

export type ContactFormData = {
    from_name: string;
    from_email: string;
    message: string;
};

type EmailJsResponse = {
    status?: number;
    text?: string;
};

const getEmailJsConfig = () => {
    const serviceId = import.meta.env.PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
        throw new Error(
            "EmailJS is not configured. Set PUBLIC_EMAILJS_SERVICE_ID, PUBLIC_EMAILJS_TEMPLATE_ID, and PUBLIC_EMAILJS_PUBLIC_KEY, then restart the dev server.",
        );
    }

    return { serviceId, templateId, publicKey };
};

let emailJsInitialized = false;

export const initContactEmail = () => {
    if (emailJsInitialized) return;

    const { publicKey } = getEmailJsConfig();
    emailjs.init({ publicKey });
    emailJsInitialized = true;
};

export const formatContactError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    if (error && typeof error === "object") {
        const response = error as EmailJsResponse;
        const rawText = typeof response.text === "string" ? response.text.trim() : "";

        if (rawText) {
            try {
                const parsed = JSON.parse(rawText) as { text?: string; message?: string };
                if (typeof parsed.text === "string" && parsed.text.trim()) {
                    return parsed.text.trim();
                }
                if (typeof parsed.message === "string" && parsed.message.trim()) {
                    return parsed.message.trim();
                }
            } catch {
                return rawText;
            }
        }

        if (typeof response.status === "number" && response.status > 0) {
            return `Email failed (${response.status}). Check your EmailJS service, template, and public key.`;
        }
    }

    return "Something went wrong. Please try again.";
};

export const sendContactEmail = async (data: ContactFormData) => {
    const { serviceId, templateId } = getEmailJsConfig();

    const response = await emailjs.send(serviceId, templateId, data);

    if (response.status !== 200) {
        throw response;
    }

    return response;
};

/** Server-validated path — swap into Contact.svelte when EMAILJS_* env vars are set on Vercel. */
export const sendContactEmailViaApi = async (data: ContactFormData) => {
    const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        errors?: Record<string, string>;
    };

    if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send message.");
    }

    return payload;
};
