<script lang="ts">
    import { onMount } from "svelte";
    import Logo from "@/components/ui/Logo.svelte";

    let reducedMotion = $state(false);

    const scrollToTop = (event: MouseEvent) => {
        event.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: reducedMotion ? "auto" : "smooth",
        });
    };

    onMount(() => {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });
</script>

<a
    href="/"
    aria-label="Back to top"
    class="pointer-events-auto ml-8 shrink-0 rounded-lg text-(--foreground) transition-opacity duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:ml-12"
    onclick={scrollToTop}
>
    <Logo class="h-11 w-11 sm:h-14 sm:w-14" aria-hidden="true" />
</a>
