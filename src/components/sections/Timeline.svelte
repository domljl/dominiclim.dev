<script lang="ts">
    import { cubicIn, cubicOut } from "svelte/easing";
    import { fly } from "svelte/transition";
    import { onMount, tick } from "svelte";
    import {
        getOrganization,
        getResumeSections,
        getScrollSections,
        isWorkEntry,
        resolveLogo,
        timelineEntries,
        type ResumeSection,
        type TimelineEntry,
    } from "@/lib/timeline";

    const entries = timelineEntries;
    const holdRatio = 0.42;
    const scrollLengthPerEntry = 1.2;
    const slideTravelRatio = 0.44;
    const incomingOpacityStart = 0.1;
    const outgoingOpacityFadeStart = 0.45;
    const incomingTiltDeg = 45;
    const incomingDepthPx = 180;
    const incomingScaleStart = 0.94;
    const compactOutgoingFadeEnd = 0.52;
    const compactIncomingFadeStart = 0.38;
    const compactIncomingLiftRatio = 0.72;
    const compactOutgoingLiftRatio = 0.35;
    const compactIncomingScaleStart = 0.97;

    const viewInMs = 460;
    const viewOutMs = 320;
    const noMotionTransition = { duration: 0 };

    type ViewMode = "scroll" | "resume";
    type ViewToggleDirection = "forward" | "back";

    let sectionRef = $state<HTMLElement | undefined>();
    let panelRef = $state<HTMLElement | undefined>();
    let showAllButtonRef = $state<HTMLButtonElement | undefined>();
    let backButtonRef = $state<HTMLButtonElement | undefined>();
    let scrollProgress = $state(0);
    let approachFill = $state(0);
    let panelHeight = $state(800);
    let viewMode = $state<ViewMode>("scroll");
    let reducedMotion = $state(false);
    let isCompactView = $state(false);
    let compactScale = $state(1);
    let compactCardHeight = $state<number | undefined>(undefined);
    let showScrollChrome = $state(true);
    let scrollChromeOpacity = $state(1);

    const cardRefs: Record<number, HTMLElement | undefined> = {};

    const trackCardRef = (node: HTMLElement, index: number) => {
        cardRefs[index] = node;

        return {
            destroy() {
                delete cardRefs[index];
            },
        };
    };
    let resumeTabByEntry = $state<Record<string, string>>({});

    const resumeTabKey = (label: string) => {
        if (label === "Leadership & Roles") return "positions";
        if (label === "Activities & Events") return "events";
        if (label === "Awards") return "awards";
        return label.toLowerCase();
    };

    const resumeTabLabel = (label: string) => {
        if (label === "Leadership & Roles") return "Positions";
        if (label === "Activities & Events") return "Events";
        if (label === "Key Contributions") return "Contributions";
        return label;
    };

    const activeResumeTab = (entry: TimelineEntry, sections: ResumeSection[]) => {
        const stored = resumeTabByEntry[entry.title];
        if (stored && sections.some((section) => resumeTabKey(section.label) === stored)) {
            return stored;
        }

        return resumeTabKey(sections[0]?.label ?? "");
    };

    const setResumeTab = (entryTitle: string, tab: string) => {
        resumeTabByEntry = { ...resumeTabByEntry, [entryTitle]: tab };
    };

    const currentIndex = $derived(Math.min(entries.length - 1, Math.max(0, Math.floor(scrollProgress))));
    const nextIndex = $derived(Math.min(entries.length - 1, currentIndex + 1));
    const segmentProgress = $derived(scrollProgress - currentIndex);
    const slideBlend = $derived.by(() => {
        if (currentIndex === nextIndex) return 0;

        if (reducedMotion) {
            return segmentProgress >= 0.5 ? 1 : 0;
        }

        if (segmentProgress < holdRatio) return 0;

        return clamp((segmentProgress - holdRatio) / (1 - holdRatio), 0, 1);
    });
    const incomingOpacity = $derived.by(() => {
        if (slideBlend <= incomingOpacityStart) return 0;
        return clamp((slideBlend - incomingOpacityStart) / (1 - incomingOpacityStart), 0, 1);
    });
    const outgoingOpacity = $derived.by(() => {
        if (slideBlend <= outgoingOpacityFadeStart) return 1;
        return clamp(
            1 - (slideBlend - outgoingOpacityFadeStart) / (1 - outgoingOpacityFadeStart),
            0,
            1,
        );
    });
    const displayIndex = $derived(slideBlend > 0.5 ? nextIndex : currentIndex);
    const indicatorProgress = $derived(currentIndex + slideBlend);
    const entryNumber = $derived(String(displayIndex + 1).padStart(2, "0"));
    const entryTotal = $derived(String(entries.length).padStart(2, "0"));
    const segmentFill = (index: number) => {
        if (currentIndex > index) {
            return 1;
        }

        if (index === 0) {
            if (scrollProgress <= 0) {
                return approachFill;
            }

            return 1;
        }

        const segmentStart = index - (1 - holdRatio);
        const segmentEnd = index + holdRatio;

        if (scrollProgress <= segmentStart) {
            return 0;
        }

        if (scrollProgress >= segmentEnd) {
            return 1;
        }

        return clamp((scrollProgress - segmentStart) / (segmentEnd - segmentStart), 0, 1);
    };

    const travelOffset = $derived(panelHeight * (isCompactView ? 0.18 : slideTravelRatio));

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const updateScrollProgress = () => {
        if (!sectionRef || viewMode !== "scroll") return;

        const sectionTop = sectionRef.offsetTop;
        const viewportHeight = window.innerHeight;
        const sectionEnd = sectionTop + entries.length * scrollLengthPerEntry * viewportHeight;
        const scrollY = window.scrollY;
        const approachStart = sectionTop - viewportHeight;

        if (scrollY < approachStart) {
            approachFill = 0;
        } else if (scrollY < sectionTop) {
            approachFill = clamp((scrollY - approachStart) / (sectionTop - approachStart), 0, 1);
        } else {
            approachFill = 1;
        }

        if (scrollY < sectionTop) {
            scrollProgress = 0;
            showScrollChrome = true;
            scrollChromeOpacity = 1;
            return;
        }

        if (scrollY >= sectionEnd) {
            scrollProgress = entries.length;
            scrollChromeOpacity = 0;
            showScrollChrome = false;
            return;
        }

        scrollProgress = clamp(
            (scrollY - sectionTop) / (viewportHeight * scrollLengthPerEntry),
            0,
            entries.length,
        );

        const certificationsSection = document.getElementById("certifications");
        const certificationsTop = certificationsSection?.getBoundingClientRect().top;

        let opacity = 1;

        if (certificationsTop !== undefined && certificationsTop < viewportHeight * 0.95) {
            opacity = Math.min(
                opacity,
                clamp((certificationsTop - viewportHeight * 0.55) / (viewportHeight * 0.4), 0, 1),
            );
        }

        const timelineEndFadeStart = sectionEnd - viewportHeight * 0.3;
        if (scrollY > timelineEndFadeStart) {
            opacity = Math.min(
                opacity,
                clamp(1 - (scrollY - timelineEndFadeStart) / (viewportHeight * 0.3), 0, 1),
            );
        }

        scrollChromeOpacity = opacity;
        showScrollChrome = scrollChromeOpacity > 0.02;
    };

    type SlideStyle = {
        visible: boolean;
        translateY: number;
        translateZ: number;
        rotateX: number;
        scale: number;
        opacity: number;
        zIndex: number;
        pointerEvents: "auto" | "none";
        transformOrigin: string;
    };

    const compactOutgoingOpacity = (blend: number) => {
        if (blend <= 0) return 1;
        if (blend >= compactOutgoingFadeEnd) return 0;
        return clamp(1 - blend / compactOutgoingFadeEnd, 0, 1);
    };

    const compactIncomingOpacity = (blend: number) => {
        if (blend <= compactIncomingFadeStart) return 0;
        return clamp((blend - compactIncomingFadeStart) / (1 - compactIncomingFadeStart), 0, 1);
    };

    const compactSlideStyle = (index: number): SlideStyle | { visible: false } => {
        if (currentIndex === nextIndex && index === currentIndex) {
            return {
                visible: true,
                translateY: 0,
                translateZ: 0,
                rotateX: 0,
                scale: 1,
                opacity: 1,
                zIndex: 20,
                pointerEvents: "auto",
                transformOrigin: "center center",
            };
        }

        if (index === currentIndex && slideBlend < 1) {
            const opacity = compactOutgoingOpacity(slideBlend);

            return {
                visible: opacity > 0.02,
                translateY: -slideBlend * travelOffset * compactOutgoingLiftRatio,
                translateZ: 0,
                rotateX: 0,
                scale: 1 - slideBlend * (1 - compactIncomingScaleStart),
                opacity,
                zIndex: 20,
                pointerEvents: opacity > 0.45 ? "auto" : "none",
                transformOrigin: "center center",
            };
        }

        if (index === nextIndex && slideBlend > 0) {
            const opacity = compactIncomingOpacity(slideBlend);
            const lift = 1 - slideBlend;

            return {
                visible: opacity > 0.02,
                translateY: lift * travelOffset * compactIncomingLiftRatio,
                translateZ: 0,
                rotateX: 0,
                scale: compactIncomingScaleStart + slideBlend * (1 - compactIncomingScaleStart),
                opacity,
                zIndex: 21,
                pointerEvents: opacity > 0.55 ? "auto" : "none",
                transformOrigin: "center center",
            };
        }

        return { visible: false };
    };

    const desktopSlideStyle = (index: number): SlideStyle | { visible: false } => {
        if (currentIndex === nextIndex && index === currentIndex) {
            return {
                visible: true,
                translateY: 0,
                translateZ: 0,
                rotateX: 0,
                scale: 1,
                opacity: 1,
                zIndex: 20,
                pointerEvents: "auto",
                transformOrigin: "center center",
            };
        }

        if (index === currentIndex && slideBlend < 1) {
            return {
                visible: true,
                translateY: -slideBlend * travelOffset,
                translateZ: reducedMotion ? 0 : -slideBlend * incomingDepthPx,
                rotateX: reducedMotion ? 0 : slideBlend * incomingTiltDeg,
                scale: reducedMotion ? 1 : 1 - slideBlend * (1 - incomingScaleStart),
                opacity: outgoingOpacity,
                zIndex: 20,
                pointerEvents: slideBlend < outgoingOpacityFadeStart ? "auto" : "none",
                transformOrigin: "center top",
            };
        }

        if (index === nextIndex && slideBlend > 0) {
            const lift = 1 - slideBlend;

            return {
                visible: true,
                translateY: lift * travelOffset,
                translateZ: reducedMotion ? 0 : -lift * incomingDepthPx,
                rotateX: reducedMotion ? 0 : lift * incomingTiltDeg,
                scale: reducedMotion ? 1 : incomingScaleStart + slideBlend * (1 - incomingScaleStart),
                opacity: incomingOpacity,
                zIndex: 21,
                pointerEvents: slideBlend > 0.65 ? "auto" : "none",
                transformOrigin: "center bottom",
            };
        }

        return { visible: false };
    };

    const slideStyle = (index: number) =>
        isCompactView ? compactSlideStyle(index) : desktopSlideStyle(index);

    const dotWeight = (index: number) => clamp(1 - Math.abs(indicatorProgress - index), 0, 1);

    const compactVerticalPadding = 120;

    const getCardCompactScale = (index: number) => {
        if (!isCompactView || viewMode !== "scroll") return 1;

        const card = cardRefs[index];
        if (!card) return compactScale;

        const availableHeight = Math.max(0, panelHeight - compactVerticalPadding);
        const naturalHeight = card.scrollHeight;

        if (naturalHeight <= 0 || availableHeight <= 0) return 1;

        return Math.min(1, availableHeight / naturalHeight);
    };

    const getCardCompactHeight = (index: number) => {
        const scale = getCardCompactScale(index);
        const card = cardRefs[index];

        if (!card || scale >= 1) return undefined;

        return card.scrollHeight * scale;
    };

    const updateCompactScale = () => {
        if (!isCompactView || viewMode !== "scroll") {
            compactScale = 1;
            compactCardHeight = undefined;
            return;
        }

        const activeCard = cardRefs[displayIndex];
        if (!activeCard) {
            compactScale = 1;
            compactCardHeight = undefined;
            return;
        }

        compactScale = getCardCompactScale(displayIndex);
        compactCardHeight = getCardCompactHeight(displayIndex);
    };

    const updatePanelHeight = () => {
        panelHeight = panelRef?.clientHeight ?? window.innerHeight;
        updateCompactScale();
    };

    $effect(() => {
        if (!isCompactView || viewMode !== "scroll") {
            compactScale = 1;
            compactCardHeight = undefined;
            return;
        }

        const indices =
            slideBlend > 0 && slideBlend < 1 ? [currentIndex, nextIndex] : [displayIndex];
        let observer: ResizeObserver | undefined;
        let cancelled = false;

        const setup = async () => {
            await tick();
            if (cancelled) return;

            updateCompactScale();
            observer?.disconnect();
            observer = new ResizeObserver(() => updateCompactScale());

            for (const index of indices) {
                const node = cardRefs[index];
                if (node) observer.observe(node);
            }
        };

        setup();

        return () => {
            cancelled = true;
            observer?.disconnect();
        };
    });

    const scrollToEntry = (index: number) => {
        if (!sectionRef || viewMode !== "scroll") return;

        const sectionTop = sectionRef.offsetTop;
        const viewportHeight = window.innerHeight;
        const targetProgress = index + holdRatio;
        const targetScrollY = sectionTop + targetProgress * scrollLengthPerEntry * viewportHeight;

        window.scrollTo({
            top: targetScrollY,
            behavior: reducedMotion ? "auto" : "smooth",
        });
    };

    const scrollViewIn = (node: Element) =>
        reducedMotion
            ? noMotionTransition
            : fly(node, { y: -20, duration: viewInMs, easing: cubicOut, opacity: 0 });

    const scrollViewOut = (node: Element) =>
        reducedMotion
            ? noMotionTransition
            : fly(node, { y: -28, duration: viewOutMs, easing: cubicIn, opacity: 0 });

    const resumeViewIn = (node: Element) =>
        reducedMotion
            ? noMotionTransition
            : fly(node, { y: 28, duration: viewInMs, easing: cubicOut, opacity: 0 });

    const resumeViewOut = (node: Element) =>
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

    const showResume = async () => {
        if (viewMode === "resume") return;

        viewMode = "resume";
        await tick();
        sectionRef?.scrollIntoView({ behavior: "auto", block: "start" });
        focusAfterViewTransition(() => backButtonRef);
    };

    const showScroll = async () => {
        if (viewMode === "scroll") return;

        viewMode = "scroll";
        await tick();
        updateScrollProgress();
        focusAfterViewTransition(() => showAllButtonRef);
    };

    onMount(async () => {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const compactQuery = window.matchMedia("(max-width: 639px)");
        isCompactView = compactQuery.matches;
        compactQuery.addEventListener("change", (event) => {
            isCompactView = event.matches;
            updatePanelHeight();
            updateCompactScale();
        });

        updateScrollProgress();
        await tick();
        updatePanelHeight();
    });
</script>

<svelte:window
    onscroll={updateScrollProgress}
    onresize={() => {
        updateScrollProgress();
        updatePanelHeight();
    }}
/>

<section
    bind:this={sectionRef}
    id="timeline"
    aria-label="Timeline"
    class="relative overflow-x-clip scroll-mt-28 sm:scroll-mt-32 {viewMode === 'resume' ? 'px-4 pb-12 sm:px-6' : ''}"
>
    {#if viewMode === "scroll"}
        <div in:scrollViewIn out:scrollViewOut>
            <div bind:this={panelRef} class="sticky top-0 h-dvh overflow-hidden">
            <nav
                class="absolute top-1/2 right-3 z-30 flex -translate-y-1/2 flex-col items-center max-sm:top-auto max-sm:right-1.5 max-sm:bottom-20 max-sm:translate-y-0 sm:right-6 lg:right-8 {showScrollChrome
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'}"
                style:opacity={scrollChromeOpacity}
                aria-label="Timeline progress"
                aria-hidden={!showScrollChrome}
            >
                <div class="flex flex-col items-center gap-2 sm:gap-2.5">
                    {#each entries as entry, index (index)}
                        {@const fill = segmentFill(index)}
                        {@const weight = dotWeight(index)}
                        {@const isActive = weight > 0.72}
                        <button
                            type="button"
                            class="relative overflow-hidden rounded-md bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_14%,transparent)] transition-all duration-300 ease-out hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) {isActive
                                ? 'h-16 w-2 shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_28%,transparent)] sm:h-28 sm:w-3'
                                : 'h-14 w-1.5 opacity-70 sm:h-24 sm:w-2'}"
                            aria-label="Go to {entry.title}"
                            aria-current={displayIndex === index ? "step" : undefined}
                            onclick={() => scrollToEntry(index)}
                        >
                            <span
                                class="pointer-events-none absolute top-0 left-0 w-full rounded-md bg-linear-to-b from-(--accent) to-[color-mix(in_srgb,var(--accent)_70%,transparent)] transition-[height] duration-150 ease-out {isActive
                                    ? 'shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_38%,transparent)]'
                                    : ''}"
                                style:height="{fill * 100}%"
                                aria-hidden="true"
                            ></span>
                        </button>
                    {/each}
                </div>
            </nav>

            <div
                class="absolute inset-0 flex items-center justify-center px-3 py-14 pr-7 sm:px-10 sm:py-16 sm:pr-10 lg:px-16"
            >
                <div
                    class="relative h-full w-full max-w-360 overflow-hidden"
                    style:perspective={reducedMotion || isCompactView ? undefined : "1400px"}
                >
                    {#each entries as entry, index (entry.title)}
                        {@const slide = slideStyle(index)}
                        {@const cardScale = isCompactView ? getCardCompactScale(index) : 1}
                        {@const cardHeight = isCompactView ? getCardCompactHeight(index) : undefined}
                        {#if slide.visible}
                            <article
                                class="absolute inset-x-0 top-1/2 flex justify-center px-0 sm:overflow-hidden sm:px-6"
                                style:transform={isCompactView
                                    ? `translate3d(0, calc(-50% + ${slide.translateY}px), 0) scale(${slide.scale})`
                                    : reducedMotion
                                      ? `translate3d(0, calc(-50% + ${slide.translateY}px), 0)`
                                      : `translate3d(0, calc(-50% + ${slide.translateY}px), ${slide.translateZ}px) rotateX(${slide.rotateX}deg) scale(${slide.scale})`}
                                style:transform-origin={slide.transformOrigin}
                                style:transform-style={isCompactView ? undefined : "preserve-3d"}
                                style:opacity={slide.opacity}
                                style:z-index={slide.zIndex}
                                style:pointer-events={slide.pointerEvents}
                                style:will-change="transform, opacity"
                                aria-hidden={index !== displayIndex}
                            >
                                <div
                                    class="w-full max-w-7xl"
                                    style:height={cardHeight ? `${cardHeight}px` : undefined}
                                >
                                    <div
                                        use:trackCardRef={index}
                                        style:transform={cardScale < 1 ? `scale(${cardScale})` : undefined}
                                        style:transform-origin="top center"
                                        style:width={cardScale < 1 ? `${100 / cardScale}%` : undefined}
                                    >
                                        {@render entryCard(entry, true, index)}
                                    </div>
                                </div>
                            </article>
                        {/if}
                    {/each}
                </div>
            </div>

            <button
                bind:this={showAllButtonRef}
                type="button"
                class="absolute bottom-4 left-3 z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:bottom-10 sm:left-8 {showScrollChrome
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'}"
                style:opacity={scrollChromeOpacity}
                aria-label="Show full timeline"
                aria-hidden={!showScrollChrome}
                tabindex={showScrollChrome ? 0 : -1}
                onclick={showResume}
            >
                {@render viewToggleButton("Show all", "forward")}
            </button>
            </div>

            <div aria-hidden="true" style:height="{entries.length * scrollLengthPerEntry * 100}vh"></div>
        </div>
    {:else}
        <div class="mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6 sm:pt-6" in:resumeViewIn out:resumeViewOut>
            <button
                bind:this={backButtonRef}
                type="button"
                class="mb-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:mb-8"
                aria-label="Return to scroll timeline"
                onclick={showScroll}
            >
                {@render viewToggleButton("Back to scroll view", "back")}
            </button>

            <div>
                {#each [...entries].reverse() as entry (entry.title)}
                    {@render resumeEntry(entry)}
                {/each}
            </div>
        </div>
    {/if}
</section>

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

{#snippet entryCard(entry: TimelineEntry, expanded = false, cardIndex?: number)}
    {#if expanded && cardIndex === displayIndex}
        <div class="mb-2 flex items-start justify-between gap-3 sm:mb-7 sm:gap-5">
            <p class="m-0 text-xs font-medium tracking-[0.2em] text-(--foreground) uppercase sm:text-base sm:tracking-[0.22em]">
                {entry.type}
            </p>
            <p class="m-0 shrink-0 font-mono text-sm text-(--foreground) sm:text-lg" aria-live="polite">
                {entryNumber}<span class="mx-1 text-(--muted-foreground)">/</span>{entryTotal}
            </p>
        </div>
    {/if}

    <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:gap-8 lg:gap-14">
        {@render entryMeta(entry, undefined, expanded)}

        {#if getScrollSections(entry).length > 0}
            <div
                class="hidden h-128 w-px shrink-0 self-start bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] sm:block lg:h-145"
                aria-hidden="true"
            ></div>
            <div
                class="min-w-0 w-full flex-1 text-left {expanded
                    ? 'space-y-3 sm:space-y-5'
                    : 'space-y-5'}"
            >
                {#each getScrollSections(entry) as section (section.label)}
                    {@render detailSection(section.label, section.items, expanded)}
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

{#snippet entryMeta(entry: TimelineEntry, index?: number, expanded = false)}
    <div
        class="flex min-w-0 w-full shrink-0 flex-col gap-2 max-sm:items-stretch max-sm:text-left sm:items-center sm:gap-5 sm:text-center {expanded
            ? 'sm:max-w-120 md:max-w-136 lg:max-w-xl'
            : 'sm:max-w-sm'}"
    >
        {@render entryLogo(entry, expanded)}

        <div class="min-w-0 w-full space-y-2 sm:space-y-3">
            {#if index !== undefined}
                <p class="m-0 font-mono text-sm text-(--muted-foreground)">
                    {String(index + 1).padStart(2, "0")}
                </p>
            {/if}

            <h2
                class="m-0 max-w-full leading-tight font-medium tracking-tight text-(--foreground) sm:mx-auto {expanded
                    ? 'text-xl sm:text-3xl md:text-4xl lg:text-5xl'
                    : 'text-lg sm:text-2xl md:text-3xl'} {entry.titleLines?.length ? '' : 'truncate'}"
                title={entry.title}
            >
                {#if entry.titleLines?.length}
                    {#each entry.titleLines as line (line)}
                        <span class="block">{line}</span>
                    {/each}
                {:else}
                    {entry.title}
                {/if}
            </h2>

            <p class="m-0 text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] {expanded ? 'text-sm sm:text-xl md:text-2xl' : 'text-sm sm:text-lg'}">{entry.date}</p>

            <a
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                class="group relative inline-block max-w-full truncate pr-4 font-medium text-(--accent) no-underline max-sm:after:left-0 max-sm:after:translate-x-0 after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 after:scale-x-0 after:rounded-full after:bg-(--accent) after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) focus-visible:after:scale-x-100 motion-reduce:after:duration-0 {expanded
                    ? 'text-base sm:text-xl md:text-2xl'
                    : 'text-sm sm:text-lg'}"
            >
                {getOrganization(entry)}
                <svg
                    class="pointer-events-none absolute top-0 right-0 text-(--accent) transition-opacity duration-200 group-hover:opacity-80 {expanded
                        ? 'h-4 w-4 sm:h-5 sm:w-5'
                        : 'h-3.5 w-3.5 sm:h-4 sm:w-4'}"
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
{/snippet}

{#snippet detailSection(label: string, items: string[], expanded = false)}
    <div class="space-y-2 sm:space-y-4">
        <h3 class="m-0 text-xs font-medium tracking-[0.16em] text-(--muted-foreground) uppercase sm:text-base sm:tracking-[0.18em]">
            {label}
        </h3>

        <ul
            class="m-0 space-y-2 leading-snug text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] sm:space-y-3 sm:leading-relaxed {expanded
                ? 'text-sm sm:text-xl'
                : 'text-sm sm:text-lg'}"
        >
            {#each items as item (item)}
                <li class="flex gap-2.5 sm:gap-4">
                    <span class="mt-1.5 h-1.5 w-4 shrink-0 rounded-full bg-(--accent) sm:mt-3 sm:h-2 sm:w-6" aria-hidden="true"></span>
                    <span>{item}</span>
                </li>
            {/each}
        </ul>
    </div>
{/snippet}

{#snippet entryLogo(entry: TimelineEntry, expanded = false)}
    {@const logoUrl = resolveLogo(entry.logo)}
    <figure class="m-0 w-full shrink-0 sm:mx-auto sm:w-auto">
        <div
            class="flex items-center justify-center overflow-hidden {expanded
                ? 'aspect-square w-full max-h-40 sm:h-64 sm:w-64 sm:max-h-none md:h-72 md:w-72 lg:h-80 lg:w-80 xl:h-96 xl:w-96'
                : 'h-20 w-20 sm:h-28 sm:w-28'}"
        >
            {#if logoUrl}
                <img
                    src={logoUrl}
                    alt="{getOrganization(entry)} logo"
                    width="384"
                    height="384"
                    class="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                />
            {:else}
                <span
                    class="font-medium text-(--muted-foreground) {expanded ? 'text-6xl lg:text-7xl' : 'text-4xl'}"
                    aria-hidden="true"
                >
                    {getOrganization(entry).charAt(0)}
                </span>
            {/if}
        </div>
    </figure>
{/snippet}

{#snippet resumeTabBar(entry: TimelineEntry, sections: ResumeSection[], activeTab: string)}
    <div
        class="flex w-full flex-nowrap gap-0.5 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] p-0.5 sm:inline-flex sm:max-w-full sm:flex-wrap sm:gap-1 sm:rounded-full sm:p-1"
        role="tablist"
        aria-label="{getOrganization(entry)} highlights"
    >
        {#each sections as section (section.label)}
            {@const tab = resumeTabKey(section.label)}
            {@const isActive = activeTab === tab}
            <button
                type="button"
                role="tab"
                id="resume-tab-{entry.title}-{tab}"
                aria-selected={isActive}
                aria-controls="resume-panel-{entry.title}-{tab}"
                class="group relative min-w-0 flex-1 basis-0 overflow-hidden rounded-[0.65rem] px-1 py-2 text-[11px] font-medium transition-[transform,color,box-shadow] duration-200 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:flex-none sm:basis-auto sm:rounded-full sm:px-4 sm:py-2.5 sm:text-sm {isActive
                    ? 'text-white shadow-[0_2px_14px_color-mix(in_srgb,var(--accent)_38%,transparent)]'
                    : 'text-(--muted-foreground) hover:text-[color-mix(in_srgb,var(--foreground)_82%,transparent)]'}"
                onclick={() => setResumeTab(entry.title, tab)}
            >
                {#if isActive}
                    <span
                        class="pointer-events-none absolute inset-0 rounded-[inherit] bg-(--accent)"
                        aria-hidden="true"
                    ></span>
                {:else}
                    <span
                        class="pointer-events-none absolute inset-0 rounded-[inherit] bg-transparent transition-colors duration-200 group-hover:bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)]"
                        aria-hidden="true"
                    ></span>
                {/if}

                <span class="relative z-1 flex min-w-0 flex-col items-center gap-0.5 sm:flex-row sm:gap-2">
                    <span class="max-w-full truncate leading-none">
                        {resumeTabLabel(section.label)}
                    </span>
                    <span
                        class="shrink-0 font-mono text-[10px] leading-none tabular-nums sm:min-w-5 sm:rounded-full sm:px-1.5 sm:py-0.5 sm:text-[11px] {isActive
                            ? 'text-white/80 sm:bg-white/20 sm:text-white'
                            : 'text-(--muted-foreground) sm:bg-[color-mix(in_srgb,var(--foreground)_9%,transparent)] sm:text-(--muted-foreground) group-hover:text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]'}"
                    >
                        {section.items.length}
                    </span>
                </span>
            </button>
        {/each}
    </div>
{/snippet}

{#snippet resumeItemList(items: string[])}
    <ul class="m-0 space-y-2.5 text-sm leading-relaxed text-[color-mix(in_srgb,var(--foreground)_68%,transparent)] sm:space-y-3 sm:text-base">
        {#each items as item (item)}
            <li class="flex gap-3 sm:gap-3.5">
                <span
                    class="mt-2 h-1.5 w-4 shrink-0 rounded-full bg-(--accent) sm:mt-2.5 sm:w-5"
                    aria-hidden="true"
                ></span>
                <span>{item}</span>
            </li>
        {/each}
    </ul>
{/snippet}

{#snippet resumeEntry(entry: TimelineEntry)}
    {@const sections = getResumeSections(entry)}
    {@const logoUrl = resolveLogo(entry.logo)}
    {@const activeTab = activeResumeTab(entry, sections)}
    <article class="pb-10 last:pb-0 sm:pb-12">
        <div class="flex gap-4 sm:gap-5">
            <figure class="m-0 shrink-0">
                <div
                    class="flex h-14 w-14 items-center justify-center overflow-hidden sm:h-16 sm:w-16"
                >
                    {#if logoUrl}
                        <img
                            src={logoUrl}
                            alt="{getOrganization(entry)} logo"
                            width="384"
                            height="384"
                            class="h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                        />
                    {:else}
                        <span
                            class="text-lg font-medium text-(--muted-foreground)"
                            aria-hidden="true"
                        >
                            {getOrganization(entry).charAt(0)}
                        </span>
                    {/if}
                </div>
            </figure>

            <div class="min-w-0 flex-1 space-y-3 sm:space-y-3.5">
                <div class="flex items-start justify-between gap-4 sm:gap-8">
                    <h3 class="m-0 min-w-0 font-medium leading-tight text-(--foreground) text-lg sm:text-xl">
                        {entry.title}
                    </h3>
                    <p class="m-0 shrink-0 text-sm text-(--muted-foreground) sm:text-base">
                        {entry.date}
                    </p>
                </div>

                <a
                    href={entry.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group relative inline-block max-w-full truncate pr-4 text-base text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] no-underline after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-full after:-translate-x-1/2 after:scale-x-0 after:rounded-full after:bg-[color-mix(in_srgb,var(--foreground)_45%,transparent)] after:transition-transform after:duration-300 after:ease-out hover:text-(--foreground) hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) focus-visible:after:scale-x-100 motion-reduce:after:duration-0 sm:text-lg"
                >
                    {getOrganization(entry)}
                    <svg
                        class="pointer-events-none absolute top-0.5 right-0 h-3.5 w-3.5 text-(--muted-foreground) transition-opacity duration-200 group-hover:opacity-80"
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

                {#if sections.length > 0}
                    {#if isWorkEntry(entry)}
                        <div class="space-y-2.5 pt-1">
                            <p class="m-0 text-xs font-medium tracking-[0.16em] text-(--muted-foreground) uppercase sm:text-sm">
                                {resumeTabLabel(sections[0].label)}
                            </p>
                            {@render resumeItemList(sections[0].items)}
                        </div>
                    {:else}
                        <div class="w-full space-y-3 pt-1 sm:space-y-4">
                            {@render resumeTabBar(entry, sections, activeTab)}

                            {#each sections as section (section.label)}
                                {@const tab = resumeTabKey(section.label)}
                                {#if activeTab === tab}
                                    <div
                                        id="resume-panel-{entry.title}-{tab}"
                                        role="tabpanel"
                                        aria-labelledby="resume-tab-{entry.title}-{tab}"
                                    >
                                        {@render resumeItemList(section.items)}
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </article>
{/snippet}
