import type { APIRoute } from "astro";
import { getSecret } from "astro:env/server";
import { validateContactForm } from "@/lib/contact-validation";

export const prerender = false;

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });

const getEmailJsEnv = () => {
    const serviceId = getSecret("EMAILJS_SERVICE_ID");
    const templateId = getSecret("EMAILJS_TEMPLATE_ID");
    const publicKey = getSecret("EMAILJS_PUBLIC_KEY");

    if (!serviceId || !templateId || !publicKey) {
        return null;
    }

    return { serviceId, templateId, publicKey };
};

export const POST: APIRoute = async ({ request }) => {
    if (request.headers.get("Content-Type") !== "application/json") {
        return json({ error: "Expected application/json." }, 415);
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return json({ error: "Invalid JSON body." }, 400);
    }

    const validation = validateContactForm(body);

    if (!validation.ok) {
        return json({ error: "Validation failed.", errors: validation.errors }, 400);
    }

    const emailJs = getEmailJsEnv();

    if (!emailJs) {
        return json({ error: "Email service is not configured." }, 500);
    }

    try {
        const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lib_version: "4.4.1",
                user_id: emailJs.publicKey,
                service_id: emailJs.serviceId,
                template_id: emailJs.templateId,
                template_params: validation.data,
            }),
        });

        const text = await response.text();

        if (!response.ok) {
            return json({ error: text || "Email provider rejected the request." }, 502);
        }

        return json({ ok: true, message: text }, 200);
    } catch {
        return json({ error: "Failed to reach email provider." }, 502);
    }
};
