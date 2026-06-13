<script lang="ts">
    import { onMount } from "svelte";
    import { formatContactError, initContactEmail, sendContactEmail, socialLinks } from "@/lib/contact";

    onMount(() => {
        initContactEmail();
    });

    type FormStatus = "idle" | "loading" | "success" | "error";
    type FieldName = "from_name" | "from_email" | "message";

    const fieldLabels: Record<FieldName, string> = {
        from_name: "Name",
        from_email: "Email",
        message: "Message",
    };

    let fromName = $state("");
    let fromEmail = $state("");
    let message = $state("");
    let status = $state<FormStatus>("idle");
    let statusMessage = $state("");
    let touched = $state<Record<FieldName, boolean>>({
        from_name: false,
        from_email: false,
        message: false,
    });

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const MIN_NAME_LENGTH = 2;
    const MIN_MESSAGE_LENGTH = 10;

    const messageLength = $derived(message.trim().length);
    const messageMeetsMinimum = $derived(messageLength >= MIN_MESSAGE_LENGTH);

    const fieldErrors = $derived.by(() => {
        const errors: Partial<Record<FieldName, string>> = {};

        if (touched.from_name && fromName.trim().length < MIN_NAME_LENGTH) {
            errors.from_name = `Enter at least ${MIN_NAME_LENGTH} characters.`;
        }

        if (touched.from_email) {
            if (!fromEmail.trim()) {
                errors.from_email = "Email is required.";
            } else if (!emailPattern.test(fromEmail.trim())) {
                errors.from_email = "Enter a valid email address.";
            }
        }

        if (touched.message && message.trim().length < MIN_MESSAGE_LENGTH) {
            errors.message = `Message must be at least ${MIN_MESSAGE_LENGTH} characters.`;
        }

        return errors;
    });

    const isFormValid = $derived(
        fromName.trim().length >= MIN_NAME_LENGTH &&
            emailPattern.test(fromEmail.trim()) &&
            message.trim().length >= MIN_MESSAGE_LENGTH,
    );

    const markTouched = (field: FieldName) => {
        touched = { ...touched, [field]: true };
    };

    const touchAll = () => {
        touched = {
            from_name: true,
            from_email: true,
            message: true,
        };
    };

    const resetForm = () => {
        fromName = "";
        fromEmail = "";
        message = "";
        touched = {
            from_name: false,
            from_email: false,
            message: false,
        };
    };

    const handleFieldInput = () => {
        if (status === "success" || status === "error") {
            status = "idle";
            statusMessage = "";
        }
    };

    const handleSubmit = async (event: SubmitEvent) => {
        event.preventDefault();
        touchAll();

        if (!isFormValid || status === "loading") return;

        status = "loading";
        statusMessage = "";

        try {
            await sendContactEmail({
                from_name: fromName.trim(),
                from_email: fromEmail.trim(),
                message: message.trim(),
            });

            status = "success";
            statusMessage =
                "I've received your message and will respond within 3–5 business days.";
            resetForm();
        } catch (error) {
            status = "error";
            statusMessage = formatContactError(error);
            console.error("Contact form error:", error);
        }
    };

    const inputBase =
        "w-full rounded-2xl border bg-transparent px-5 py-4 text-base text-(--foreground) shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-1 transition-[box-shadow,ring-color] duration-200 placeholder:text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] sm:px-6 sm:py-4.5 sm:text-lg";
    const inputDefault =
        "border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] hover:ring-[color-mix(in_srgb,var(--foreground)_22%,transparent)]";
    const inputError =
        "border-[color-mix(in_srgb,var(--accent)_40%,transparent)] ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]";
    const glassPanel =
        "relative min-w-0 overflow-hidden rounded-3xl bg-transparent shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)]";
    const panelPadding = "p-6 sm:p-8 lg:p-10";
    const socialButton =
        "group/btn relative inline-flex w-full min-w-0 items-center justify-center gap-2.5 overflow-hidden rounded-full bg-transparent px-5 py-3.5 text-base text-(--foreground) no-underline shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:hover:scale-100 motion-reduce:active:scale-100 sm:px-6 sm:py-4";
</script>

{#snippet glassLayers()}
    <span
        class="pointer-events-none absolute inset-0 z-1 rounded-[inherit] backdrop-blur-md"
        aria-hidden="true"
    ></span>
    <span
        class="pointer-events-none absolute inset-0 z-2 rounded-[inherit] bg-white/20 dark:bg-black/20"
        aria-hidden="true"
    ></span>
    <span
        class="pointer-events-none absolute inset-0 z-3 rounded-[inherit] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.12)]"
        aria-hidden="true"
    ></span>
{/snippet}

{#snippet socialButtonLayers()}
    <span
        class="pointer-events-none absolute inset-0 z-1 rounded-[inherit] backdrop-blur-md"
        aria-hidden="true"
    ></span>
    <span
        class="pointer-events-none absolute inset-0 z-2 rounded-[inherit] bg-white/20 dark:bg-black/20"
        aria-hidden="true"
    ></span>
    <span
        class="pointer-events-none absolute inset-0 z-3 rounded-[inherit] bg-[color-mix(in_srgb,var(--accent)_0%,transparent)] transition-colors duration-200 group-hover/btn:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
        aria-hidden="true"
    ></span>
{/snippet}

<section
    id="contact"
    aria-label="Contact"
    class="scroll-mt-28 px-4 py-24 sm:scroll-mt-32 sm:px-6 sm:py-28 lg:py-32"
>
    <div class="mx-auto w-full max-w-360">
        <div class="mb-10 space-y-3 sm:mb-12 sm:space-y-4">
            <p
                class="m-0 text-xs font-medium tracking-[0.2em] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] uppercase sm:text-sm sm:tracking-[0.22em]"
            >
                Connect
            </p>
            <h2
                class="m-0 text-4xl leading-tight font-medium tracking-tight text-(--foreground) sm:text-5xl md:text-6xl lg:text-7xl"
            >
                Get in touch
            </h2>
            <p
                class="m-0 max-w-2xl text-lg leading-relaxed text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] sm:text-xl"
            >
                Have a question or opportunity? Send a message and I'll get back to you.
            </p>
        </div>

        <form
            class="{glassPanel} {panelPadding}"
            onsubmit={handleSubmit}
            novalidate
        >
            {@render glassLayers()}

            <div class="relative z-4 space-y-6 sm:space-y-7">
                    <div class="space-y-2.5">
                        <label
                            for="contact-name"
                            class="block text-base font-medium text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] sm:text-lg"
                        >
                            {fieldLabels.from_name}
                        </label>
                        <input
                            id="contact-name"
                            name="from_name"
                            type="text"
                            autocomplete="name"
                            minlength={MIN_NAME_LENGTH}
                            bind:value={fromName}
                            oninput={handleFieldInput}
                            onblur={() => markTouched("from_name")}
                            disabled={status === "loading"}
                            aria-invalid={fieldErrors.from_name ? "true" : undefined}
                            aria-describedby={fieldErrors.from_name
                                ? "contact-name-error contact-name-hint"
                                : "contact-name-hint"}
                            class="{inputBase} {fieldErrors.from_name ? inputError : inputDefault}"
                            placeholder="Your name"
                        />
                        <p
                            id="contact-name-hint"
                            class="m-0 text-sm text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]"
                        >
                            At least {MIN_NAME_LENGTH} characters.
                        </p>
                        {#if fieldErrors.from_name}
                            <p
                                id="contact-name-error"
                                class="m-0 text-sm text-(--accent)"
                                role="alert"
                            >
                                {fieldErrors.from_name}
                            </p>
                        {/if}
                    </div>

                    <div class="space-y-2.5">
                        <label
                            for="contact-email"
                            class="block text-base font-medium text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] sm:text-lg"
                        >
                            {fieldLabels.from_email}
                        </label>
                        <input
                            id="contact-email"
                            name="from_email"
                            type="email"
                            autocomplete="email"
                            inputmode="email"
                            bind:value={fromEmail}
                            oninput={handleFieldInput}
                            onblur={() => markTouched("from_email")}
                            disabled={status === "loading"}
                            aria-invalid={fieldErrors.from_email ? "true" : undefined}
                            aria-describedby={fieldErrors.from_email ? "contact-email-error" : undefined}
                            class="{inputBase} {fieldErrors.from_email ? inputError : inputDefault}"
                            placeholder="you@example.com"
                        />
                        {#if fieldErrors.from_email}
                            <p
                                id="contact-email-error"
                                class="m-0 text-sm text-(--accent)"
                                role="alert"
                            >
                                {fieldErrors.from_email}
                            </p>
                        {/if}
                    </div>

                    <div class="space-y-2.5">
                        <label
                            for="contact-message"
                            class="block text-base font-medium text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] sm:text-lg"
                        >
                            {fieldLabels.message}
                        </label>
                        <textarea
                            id="contact-message"
                            name="message"
                            rows="6"
                            minlength={MIN_MESSAGE_LENGTH}
                            bind:value={message}
                            oninput={handleFieldInput}
                            onblur={() => markTouched("message")}
                            disabled={status === "loading"}
                            aria-invalid={fieldErrors.message ? "true" : undefined}
                            aria-describedby={fieldErrors.message
                                ? "contact-message-error contact-message-hint"
                                : "contact-message-hint"}
                            class="{inputBase} min-h-40 resize-y sm:min-h-48 {fieldErrors.message ? inputError : inputDefault}"
                            placeholder="What would you like to discuss?"
                        ></textarea>
                        <div
                            id="contact-message-hint"
                            class="flex items-center justify-between gap-3 text-sm"
                        >
                            <p class="m-0 text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                                Minimum {MIN_MESSAGE_LENGTH} characters.
                            </p>
                            <p
                                class="m-0 font-medium {messageMeetsMinimum
                                    ? 'text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]'
                                    : 'text-(--accent)'}"
                                aria-live="polite"
                            >
                                {messageLength}/{MIN_MESSAGE_LENGTH}
                            </p>
                        </div>
                        {#if fieldErrors.message}
                            <p
                                id="contact-message-error"
                                class="m-0 text-sm text-(--accent)"
                                role="alert"
                            >
                                {fieldErrors.message}
                            </p>
                        {/if}
                    </div>

                    <div class="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="submit"
                            disabled={status === "loading" || !isFormValid}
                            class="group/btn relative inline-flex min-h-14 items-center justify-center gap-2.5 overflow-hidden rounded-full bg-transparent px-8 py-4 text-base font-medium text-(--foreground) shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] transition-[transform,box-shadow,opacity] duration-200 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:pointer-events-none disabled:opacity-45 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 sm:min-h-16 sm:px-10 sm:text-lg {status ===
                            'success'
                                ? 'ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]'
                                : ''} {status === 'error'
                                ? 'ring-[color-mix(in_srgb,var(--accent)_40%,transparent)]'
                                : ''}"
                        >
                            <span
                                class="pointer-events-none absolute inset-0 z-1 rounded-[inherit] backdrop-blur-md"
                                aria-hidden="true"
                            ></span>
                            <span
                                class="pointer-events-none absolute inset-0 z-2 rounded-[inherit] bg-white/20 dark:bg-black/20"
                                aria-hidden="true"
                            ></span>
                            <span
                                class="pointer-events-none absolute inset-0 z-3 rounded-[inherit] bg-[color-mix(in_srgb,var(--accent)_0%,transparent)] transition-colors duration-200 group-hover/btn:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] group-disabled/btn:bg-transparent"
                                aria-hidden="true"
                            ></span>

                            {#if status === "loading"}
                                <svg
                                    class="relative z-5 h-5 w-5 animate-spin text-(--accent) motion-reduce:animate-none"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    ></circle>
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    ></path>
                                </svg>
                                <span class="relative z-5">Sending…</span>
                            {:else if status === "success"}
                                <svg
                                    class="relative z-5 h-5 w-5 text-(--accent)"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                                <span class="relative z-5">Sent</span>
                            {:else if status === "error"}
                                <svg
                                    class="relative z-5 h-5 w-5 text-(--accent)"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4" />
                                    <path d="M12 16h.01" />
                                </svg>
                                <span class="relative z-5">Try again</span>
                            {:else}
                                <span class="relative z-5">Send message</span>
                            {/if}
                        </button>

                        {#if statusMessage}
                            <p
                                class="m-0 max-w-md text-base leading-relaxed sm:text-lg {status === 'success'
                                    ? 'text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]'
                                    : 'text-(--accent)'}"
                                role="status"
                                aria-live="polite"
                            >
                                {statusMessage}
                            </p>
                        {/if}
                    </div>

                    <div
                        class="border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] pt-6 sm:pt-7"
                        aria-label="Contact links"
                    >
                        <div class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                            <a
                                href={socialLinks.email}
                                class={socialButton}
                                aria-label="Email Dominic Lim at domljl07@gmail.com"
                            >
                                {@render socialButtonLayers()}
                                <svg
                                    class="relative z-5 h-5 w-5 shrink-0 text-(--accent)"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                <span class="relative z-5 truncate font-medium">domljl07@gmail.com</span>
                            </a>

                            <a
                                href={socialLinks.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                class={socialButton}
                                aria-label="Visit Dominic Lim on GitHub"
                            >
                                {@render socialButtonLayers()}
                                <svg
                                    class="relative z-5 h-5 w-5 shrink-0 text-(--accent)"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                                    />
                                </svg>
                                <span class="relative z-5 font-medium">GitHub</span>
                            </a>

                            <a
                                href={socialLinks.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                class={socialButton}
                                aria-label="Visit Dominic Lim on LinkedIn"
                            >
                                {@render socialButtonLayers()}
                                <svg
                                    class="relative z-5 h-5 w-5 shrink-0 text-(--accent)"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.062 2.062 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                                    />
                                </svg>
                                <span class="relative z-5 font-medium">LinkedIn</span>
                            </a>
                        </div>
                    </div>
                </div>
            </form>
    </div>
</section>

<!-- Hallmark · component: contact-form · genre: editorial · theme: preserved-site-tokens
     states: default · hover · focus · active · disabled · loading · error · success
-->
