<script lang="ts">
    let isVisible = $state(true);

    const handleScroll = () => {
        isVisible = window.scrollY < 100;
    };
</script>

<svelte:window onscroll={handleScroll} />

<div
    class="absolute inset-x-0 bottom-6 flex justify-center transition-opacity duration-300 sm:bottom-8 {isVisible
        ? 'opacity-100'
        : 'pointer-events-none opacity-0'}"
    aria-hidden={!isVisible}
>
    <div class="flex flex-col items-center motion-reduce:animate-none animate-bounce">
        <p
            class="mb-2 text-sm text-[color-mix(in_srgb,var(--foreground)_85%,transparent)] md:text-base"
        >
            Scroll to learn more
        </p>
        <svg
            class="h-6 w-6 text-(--accent)"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
        </svg>
    </div>
</div>
