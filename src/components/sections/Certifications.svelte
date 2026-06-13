<script lang="ts">
    import { cubicIn, cubicOut } from "svelte/easing";
    import { fly } from "svelte/transition";
    import { onMount, tick } from "svelte";
    import {
        certifications,
        getIssuerLabel,
        resolveIcon,
        type Certification,
    } from "@/lib/certifications";

    const entries = certifications;
    const cardWidthRatio = 0.92;
    const cardWidthRatioMobile = 0.96;
    const cardOverlapDesktopPx = 64;
    const cardOverlapMobilePx = 24;
    const cardMaxWidthPx = 1056;
    const viewInMs = 460;
    const viewOutMs = 320;
    const noMotionTransition = { duration: 0 };

    type ViewMode = "carousel" | "all";
    type ViewToggleDirection = "forward" | "back";

    let sectionRef = $state<HTMLElement | undefined>();
    let trackRef = $state<HTMLElement | undefined>();
    let showAllButtonRef = $state<HTMLButtonElement | undefined>();
    let backButtonRef = $state<HTMLButtonElement | undefined>();
    let activeIndex = $state(0);
    let reducedMotion = $state(false);
    let cardWidth = $state(320);
    let cardOverlap = $state(64);
    let trackPadding = $state(0);
    let viewMode = $state<ViewMode>("carousel");

    const cardRefs: Record<number, HTMLElement | undefined> = {};

    const trackCardRef = (node: HTMLElement, index: number) => {
        cardRefs[index] = node;

        return {
            destroy() {
                delete cardRefs[index];
            },
        };
    };

    const entryNumber = $derived(String(activeIndex + 1).padStart(2, "0"));
    const entryTotal = $derived(String(entries.length).padStart(2, "0"));
    const canGoPrev = $derived(activeIndex > 0);
    const canGoNext = $derived(activeIndex < entries.length - 1);

    const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value));

    const isMobileTrack = () => (trackRef?.clientWidth ?? 0) < 640;

    const getCardOverlap = () => (isMobileTrack() ? cardOverlapMobilePx : cardOverlapDesktopPx);

    const getCardWidth = () => {
        if (!trackRef) return cardMaxWidthPx;
        const viewportWidth = trackRef.clientWidth;
        const ratio = isMobileTrack() ? cardWidthRatioMobile : cardWidthRatio;
        return Math.min(cardMaxWidthPx, viewportWidth * ratio);
    };

    const getCenterOffset = () => {
        if (!trackRef) return 0;
        return (trackRef.clientWidth - cardWidth) / 2;
    };

    const updateActiveIndex = () => {
        const refs = Object.values(cardRefs).filter(Boolean) as HTMLElement[];
        if (!trackRef || refs.length === 0) return;

        const trackCenter = trackRef.scrollLeft + trackRef.clientWidth / 2;
        let closestIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (let index = 0; index < entries.length; index += 1) {
            const card = cardRefs[index];
            if (!card) continue;

            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(cardCenter - trackCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        }

        activeIndex = closestIndex;
    };

    const scrollToIndex = async (index: number) => {
        const targetIndex = clamp(index, 0, entries.length - 1);
        const targetCard = cardRefs[targetIndex];
        if (!trackRef || !targetCard) return;

        const targetLeft = targetCard.offsetLeft - getCenterOffset();

        trackRef.scrollTo({
            left: targetLeft,
            behavior: reducedMotion ? "auto" : "smooth",
        });

        activeIndex = targetIndex;
    };

    const goPrev = () => {
        if (!canGoPrev) return;
        scrollToIndex(activeIndex - 1);
    };

    const goNext = () => {
        if (!canGoNext) return;
        scrollToIndex(activeIndex + 1);
    };

    const cardStyle = (index: number) => {
        const distance = index - activeIndex;
        const absDistance = Math.abs(distance);

        if (reducedMotion) {
            return {
                transform: "scale(1)",
                opacity: absDistance === 0 ? 1 : absDistance === 1 ? 0.65 : 0.35,
                zIndex: absDistance === 0 ? 30 : absDistance === 1 ? 20 : 10,
            };
        }

        const scale =
            absDistance === 0 ? 1 : absDistance === 1 ? 0.93 : clamp(0.86 - (absDistance - 2) * 0.04, 0.74, 0.86);
        const opacity =
            absDistance === 0 ? 1 : absDistance === 1 ? 0.62 : clamp(0.38 - (absDistance - 2) * 0.08, 0.18, 0.38);
        const zIndex = absDistance === 0 ? 30 : absDistance === 1 ? 20 : 10;

        return {
            transform: `scale(${scale})`,
            opacity,
            zIndex,
        };
    };

    const updateLayout = async () => {
        if (viewMode !== "carousel") return;

        cardWidth = getCardWidth();
        cardOverlap = getCardOverlap();
        trackPadding = getCenterOffset();
        await tick();
        updateActiveIndex();
    };

    const carouselViewIn = (node: Element) =>
        reducedMotion
            ? noMotionTransition
            : fly(node, { y: -20, duration: viewInMs, easing: cubicOut, opacity: 0 });

    const carouselViewOut = (node: Element) =>
        reducedMotion
            ? noMotionTransition
            : fly(node, { y: -28, duration: viewOutMs, easing: cubicIn, opacity: 0 });

    const allViewIn = (node: Element) =>
        reducedMotion
            ? noMotionTransition
            : fly(node, { y: 28, duration: viewInMs, easing: cubicOut, opacity: 0 });

    const allViewOut = (node: Element) =>
        reducedMotion
            ? noMotionTransition
            : fly(node, { y: 20, duration: viewOutMs, easing: cubicIn, opacity: 0 });

    const focusAfterViewTransition = (focusTarget: () => HTMLButtonElement | undefined) => {
        if (reducedMotion) {
            focusTarget()?.focus();
            return;
        }

        window.setTimeout(() => focusTarget()?.focus(), viewInMs);
    };

    const showAll = async () => {
        if (viewMode === "all") return;

        viewMode = "all";
        await tick();
        sectionRef?.scrollIntoView({ behavior: "auto", block: "start" });
        focusAfterViewTransition(() => backButtonRef);
    };

    const showCarousel = async () => {
        if (viewMode === "carousel") return;

        viewMode = "carousel";
        await tick();
        updateLayout();
        focusAfterViewTransition(() => showAllButtonRef);
    };

    onMount(() => {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        updateLayout();
    });
</script>

<svelte:window
    onresize={() => {
        if (viewMode === "carousel") updateLayout();
    }}
/>

<section
    bind:this={sectionRef}
    id="certifications"
    aria-label="Certifications"
    class="relative scroll-mt-28 px-4 py-20 sm:scroll-mt-32 sm:px-6 sm:py-24 {viewMode === 'carousel' ? 'flex min-h-0 flex-col justify-center sm:min-h-[75vh] lg:min-h-[85vh]' : ''}"
>
    <div class="mx-auto w-full max-w-360">
        <div class="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div class="space-y-2 sm:space-y-3">
                <p
                    class="m-0 text-xs font-medium tracking-[0.2em] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] uppercase sm:text-sm sm:tracking-[0.22em]"
                >
                    Credentials
                </p>
                <h2
                    class="m-0 text-4xl leading-tight font-medium tracking-tight text-(--foreground) sm:text-5xl md:text-6xl"
                >
                    Certifications
                </h2>
            </div>
            {#if viewMode === "carousel"}
                <p class="m-0 shrink-0 font-mono text-base text-(--foreground) sm:text-xl" aria-live="polite">
                    {entryNumber}<span class="mx-1 text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">/</span>{entryTotal}
                </p>
            {/if}
        </div>

        {#if viewMode === "carousel"}
            <div in:carouselViewIn out:carouselViewOut>
                <section
                    class="relative"
                    aria-roledescription="carousel"
                    aria-label="Certification carousel"
                >
                    <div
                        bind:this={trackRef}
                        class="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth py-5 [-ms-overflow-style:none] scrollbar-none sm:py-10 [&::-webkit-scrollbar]:hidden"
                        style:padding-inline="{trackPadding}px"
                        onscroll={updateActiveIndex}
                    >
                        {#each entries as cert, index (cert.title)}
                            {@const style = cardStyle(index)}
                            {@const iconUrl = resolveIcon(cert.icon)}
                            {@const issuer = getIssuerLabel(cert.icon)}
                            <article
                                use:trackCardRef={index}
                                class="relative shrink-0 snap-center transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
                                style:width="{cardWidth}px"
                                style:margin-inline="-{cardOverlap / 2}px"
                                style:transform={style.transform}
                                style:opacity={style.opacity}
                                style:z-index={style.zIndex}
                                aria-hidden={index !== activeIndex}
                            >
                                {@render certificationCard(cert, iconUrl, issuer, index === activeIndex)}
                            </article>
                        {/each}
                    </div>

                    <div
                        class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-(--background) to-transparent sm:w-12"
                        aria-hidden="true"
                    ></div>
                    <div
                        class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-(--background) to-transparent sm:w-12"
                        aria-hidden="true"
                    ></div>

                    <div class="mt-4 flex items-center justify-center gap-4 sm:mt-6 sm:gap-5">
                        {@render navButton("Previous certification", goPrev, !canGoPrev, "prev")}
                        <div class="flex items-center gap-2" aria-hidden="true">
                            {#each entries as _, index (index)}
                                <span
                                    class="rounded-full transition-all duration-300 {index === activeIndex
                                        ? 'h-2 w-6 bg-(--accent)'
                                        : 'h-2 w-2 bg-[color-mix(in_srgb,var(--foreground)_25%,transparent)]'}"
                                ></span>
                            {/each}
                        </div>
                        {@render navButton("Next certification", goNext, !canGoNext, "next")}
                    </div>
                </section>

                <div class="mt-6 flex justify-start sm:mt-8">
                    <button
                        bind:this={showAllButtonRef}
                        type="button"
                        class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
                        aria-label="Show all certifications"
                        onclick={showAll}
                    >
                        {@render viewToggleButton("Show all", "forward")}
                    </button>
                </div>
            </div>
        {:else}
            <div class="mx-auto w-full max-w-3xl" in:allViewIn out:allViewOut>
                <button
                    bind:this={backButtonRef}
                    type="button"
                    class="mb-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:mb-8"
                    aria-label="Return to carousel view"
                    onclick={showCarousel}
                >
                    {@render viewToggleButton("Back to carousel", "back")}
                </button>

                <div class="grid gap-4 sm:gap-5 lg:grid-cols-2">
                    {#each entries as cert (cert.title)}
                        {@const iconUrl = resolveIcon(cert.icon)}
                        {@const issuer = getIssuerLabel(cert.icon)}
                        {@render listCertEntry(cert, iconUrl, issuer)}
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</section>

{#snippet navButton(
    label: string,
    onclick: () => void,
    disabled: boolean,
    direction: "prev" | "next",
)}
    <button
        type="button"
        class="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-transparent shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] transition-[transform,box-shadow,opacity] duration-200 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:pointer-events-none disabled:opacity-35 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 h-11 w-11 sm:h-14 sm:w-14"
        aria-label={label}
        {disabled}
        {onclick}
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
            class="pointer-events-none absolute inset-0 z-3 rounded-[inherit] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.12)]"
            aria-hidden="true"
        ></span>
        <span
            class="pointer-events-none absolute inset-0 z-4 rounded-[inherit] bg-[color-mix(in_srgb,var(--accent)_0%,transparent)] transition-colors duration-200 group-hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] group-disabled:bg-transparent"
            aria-hidden="true"
        ></span>

        {#if direction === "prev"}
            <svg
                class="relative z-5 h-4 w-4 text-(--accent) transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:group-hover:translate-x-0 sm:h-4.5 sm:w-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
            </svg>
        {:else}
            <svg
                class="relative z-5 h-4 w-4 text-(--accent) transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0 sm:h-4.5 sm:w-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
            </svg>
        {/if}
    </button>
{/snippet}

{#snippet viewToggleButton(label: string, direction: ViewToggleDirection)}
    <span
        class="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-transparent px-5 py-2.5 text-(--foreground) shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] transition-[transform,box-shadow] duration-200 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] active:scale-[0.97] motion-reduce:hover:scale-100 motion-reduce:active:scale-100 sm:gap-3 sm:px-6 sm:py-3"
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
            class="pointer-events-none absolute inset-0 z-3 rounded-[inherit] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.12)]"
            aria-hidden="true"
        ></span>
        <span
            class="pointer-events-none absolute inset-0 z-4 rounded-[inherit] bg-[color-mix(in_srgb,var(--accent)_0%,transparent)] transition-colors duration-200 group-hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
            aria-hidden="true"
        ></span>

        {#if direction === "back"}
            <svg
                class="relative z-5 h-4 w-4 shrink-0 text-(--accent) transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:group-hover:translate-x-0 sm:h-4.5 sm:w-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
            </svg>
        {:else}
            <svg
                class="relative z-5 h-4 w-4 shrink-0 text-(--accent) sm:h-4.5 sm:w-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M8 6h13" />
                <path d="M8 12h13" />
                <path d="M8 18h13" />
                <path d="M3 6h.01" />
                <path d="M3 12h.01" />
                <path d="M3 18h.01" />
            </svg>
        {/if}

        <span class="relative z-5 text-sm font-medium tracking-tight sm:text-base">{label}</span>
    </span>
{/snippet}

{#snippet listCertEntry(cert: Certification, iconUrl: string, issuer: string)}
    <article
        class="relative overflow-hidden rounded-2xl bg-transparent p-4 shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] sm:p-5"
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
            class="pointer-events-none absolute inset-0 z-3 rounded-[inherit] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.12)]"
            aria-hidden="true"
        ></span>

        <div class="relative z-4 flex gap-4 sm:gap-5">
            <figure class="m-0 shrink-0">
                <div class="flex h-12 w-12 items-center justify-center overflow-hidden sm:h-14 sm:w-14">
                    {#if iconUrl}
                        <img
                            src={iconUrl}
                            alt="{issuer} logo"
                            class="h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                        />
                    {:else}
                        <span
                            class="flex h-full w-full items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] text-lg font-medium text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]"
                            aria-hidden="true"
                        >
                            {issuer.charAt(0)}
                        </span>
                    {/if}
                </div>
            </figure>

            <div class="min-w-0 flex-1 space-y-2 sm:space-y-2.5">
                <div class="flex items-start justify-between gap-3 sm:gap-4">
                    <h3 class="m-0 min-w-0 text-base leading-tight font-medium text-(--foreground) sm:text-lg">
                        {cert.title}
                    </h3>
                    <p class="m-0 shrink-0 text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] sm:text-sm">
                        {cert.dateOfIssue}
                    </p>
                </div>

                <p class="m-0 text-xs text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] uppercase tracking-[0.14em] sm:text-sm">
                    {cert.type}
                </p>

                <p class="m-0 text-sm text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] sm:text-base">
                    {issuer}
                </p>

                {#if cert.description}
                    <p class="m-0 line-clamp-2 text-sm leading-relaxed text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] sm:text-base">
                        {cert.description}
                    </p>
                {/if}

                <a
                    href={cert.credential}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group relative inline-block max-w-full truncate pr-4 text-sm font-medium text-(--accent) no-underline max-sm:after:left-0 max-sm:after:translate-x-0 after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 after:scale-x-0 after:rounded-full after:bg-(--accent) after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) focus-visible:after:scale-x-100 motion-reduce:after:duration-0 sm:text-base"
                >
                    Verify credential
                    <svg
                        class="pointer-events-none absolute top-0 right-0 text-(--accent) opacity-60 transition-opacity duration-200 group-hover:opacity-100 h-3.5 w-3.5 sm:h-4 sm:w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M7 17 17 7" />
                        <path d="M9 7h8v8" />
                    </svg>
                </a>
            </div>
        </div>
    </article>
{/snippet}

{#snippet certificationCard(
    cert: Certification,
    iconUrl: string,
    issuer: string,
    isActive: boolean,
)}
    <div
        class="relative min-h-56 overflow-hidden rounded-3xl bg-transparent p-5 shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] sm:min-h-72 sm:p-7 md:min-h-80 md:p-9"
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
            class="pointer-events-none absolute inset-0 z-3 rounded-[inherit] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.12)]"
            aria-hidden="true"
        ></span>

        <div class="relative z-4 flex h-full flex-col gap-4 sm:gap-6 lg:flex-row lg:items-stretch lg:gap-10">
            <div class="flex min-w-0 shrink-0 flex-col items-start gap-4 sm:gap-5 lg:w-64 xl:w-72">
                <figure class="m-0">
                    <div
                        class="flex h-20 w-20 items-center justify-center overflow-hidden sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32"
                    >
                        {#if iconUrl}
                            <img
                                src={iconUrl}
                                alt="{issuer} logo"
                                class="h-full w-full object-contain"
                                loading="lazy"
                                decoding="async"
                            />
                        {:else}
                            <span
                                class="flex h-full w-full items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] text-2xl font-medium text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] sm:text-3xl md:text-4xl"
                                aria-hidden="true"
                            >
                                {issuer.charAt(0)}
                            </span>
                        {/if}
                    </div>
                </figure>

                <div class="space-y-2 sm:space-y-3">
                    <p
                        class="m-0 text-xs font-medium tracking-[0.16em] text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] uppercase sm:text-sm"
                    >
                        {cert.type}
                    </p>
                    <h3
                        class="m-0 text-xl leading-tight font-medium tracking-tight text-(--foreground) sm:text-3xl md:text-4xl"
                    >
                        {cert.title}
                    </h3>
                    <p class="m-0 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] sm:text-base md:text-lg">
                        Issued {cert.dateOfIssue}
                    </p>
                    <p class="m-0 text-sm text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] sm:text-base md:text-lg">
                        {issuer}
                    </p>
                </div>
            </div>

            <div
                class="hidden w-px shrink-0 self-stretch bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] lg:block"
                aria-hidden="true"
            ></div>

            <div class="min-w-0 flex-1 space-y-4 sm:space-y-5">
                {#if cert.description}
                    <p
                        class="m-0 text-base leading-relaxed text-[color-mix(in_srgb,var(--foreground)_78%,transparent)] max-sm:line-clamp-3 sm:text-lg md:text-xl"
                    >
                        {cert.description}
                    </p>
                {/if}

                {#if cert.skills.length > 0}
                    <div class="space-y-3 sm:space-y-4 {cert.description ? 'mt-4 sm:mt-6' : ''}">
                        <h4
                            class="m-0 text-xs font-medium tracking-[0.16em] text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] uppercase sm:text-sm sm:tracking-[0.18em]"
                        >
                            Skills covered
                        </h4>
                        <ul
                            class="m-0 space-y-2 text-base leading-snug text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] max-sm:text-sm sm:space-y-3 sm:text-lg sm:leading-relaxed"
                        >
                            {#each cert.skills as skill (skill)}
                                <li class="flex gap-3 sm:gap-3.5">
                                    <span
                                        class="mt-2 h-1.5 w-4 shrink-0 rounded-full bg-(--accent) sm:mt-2.5 sm:h-2 sm:w-5"
                                        aria-hidden="true"
                                    ></span>
                                    <span>{skill}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                {#if isActive}
                    <a
                        href={cert.credential}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group relative inline-block max-w-full truncate pr-4 font-medium text-(--accent) no-underline max-sm:after:left-0 max-sm:after:translate-x-0 after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 after:scale-x-0 after:rounded-full after:bg-(--accent) after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) focus-visible:after:scale-x-100 motion-reduce:after:duration-0 text-base sm:text-lg"
                    >
                        Verify credential
                        <svg
                            class="pointer-events-none absolute top-0 right-0 text-(--accent) opacity-60 transition-opacity duration-200 group-hover:opacity-100 h-3.5 w-3.5 sm:h-4 sm:w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M7 17 17 7" />
                            <path d="M9 7h8v8" />
                        </svg>
                    </a>
                {/if}
            </div>
        </div>
    </div>
{/snippet}
