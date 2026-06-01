<script lang="ts">
    import { onMount } from "svelte";
    import { cubicOut } from "svelte/easing";
    import { fade, fly } from "svelte/transition";

    const showAfterPx = 320;

    const glassLayer = "pointer-events-none absolute inset-0 rounded-[inherit]";
    const glassCardClass =
        "relative overflow-hidden rounded-full bg-transparent shadow-[0_8px_32px_rgba(0,0,0,0.22)]";

    let isVisible = $state(false);
    let reducedMotion = $state(false);

    const handleScroll = () => {
        isVisible = window.scrollY > showAfterPx;
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: reducedMotion ? "auto" : "smooth",
        });
    };

    onMount(() => {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        handleScroll();
    });
</script>

<svelte:window onscroll={handleScroll} />

{#if isVisible}
    <button
        type="button"
        aria-label="Back to top"
        onclick={scrollToTop}
        class="fixed right-4 bottom-6 z-40 sm:right-6 sm:bottom-8"
        in:fly={reducedMotion ? { duration: 0 } : { y: 16, duration: 260, easing: cubicOut }}
        out:fade={reducedMotion ? { duration: 0 } : { duration: 180 }}
    >
        <span
            class="{glassCardClass} flex h-12 w-12 items-center justify-center text-(--foreground) ring-1 ring-[color-mix(in_srgb,var(--foreground)_10%,transparent)] transition-transform duration-200 hover:scale-105 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
        >
            <span class="{glassLayer} z-1 backdrop-blur-xs" aria-hidden="true"></span>
            <span class="{glassLayer} z-2 bg-white/25 dark:bg-black/25" aria-hidden="true"></span>
            <span
                class="{glassLayer} z-3 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.75)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15)]"
                aria-hidden="true"
            ></span>

            <svg
                class="relative z-4 h-5 w-5 text-(--accent)"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
        </span>
    </button>
{/if}
