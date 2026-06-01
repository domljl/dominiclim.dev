<script lang="ts">
    import { onMount } from "svelte";
    import { getTheme, subscribeToColorScheme, toggleTheme } from "@/lib/theme";

    interface Props {
        embedded?: boolean;
    }

    let { embedded = false }: Props = $props();

    let isDarkMode = $state(false);
    let reducedMotion = $state(false);

    onMount(() => {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        isDarkMode = getTheme() === "dark";

        return subscribeToColorScheme((dark) => {
            isDarkMode = dark;
        });
    });

    const handleToggle = () => {
        isDarkMode = toggleTheme();
    };
</script>

<button
    type="button"
    onclick={handleToggle}
    class="pointer-events-auto rounded-xl border p-3.5 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) {embedded
        ? 'flex w-full justify-center border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]'
        : 'mr-8 sm:mr-12 sm:p-4'} {embedded
        ? ''
        : isDarkMode
        ? 'border-gray-600 bg-gray-800 hover:bg-gray-700'
        : 'border-gray-300 bg-gray-100 hover:bg-gray-200'} {embedded || reducedMotion
        ? ''
        : 'hover:scale-110 active:scale-95'}"
    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
>
    {#key isDarkMode}
        <div
            class="flex h-5.5 w-5.5 items-center justify-center motion-reduce:animate-none animate-theme-toggle-in sm:h-6 sm:w-6"
        >
            {#if isDarkMode}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2.5"
                    stroke="currentColor"
                    class="h-5.5 w-5.5 text-yellow-400 sm:h-6 sm:w-6"
                    aria-hidden="true"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    />
                </svg>
            {:else}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2.5"
                    stroke="currentColor"
                    class="h-5.5 w-5.5 text-blue-600 sm:h-6 sm:w-6"
                    aria-hidden="true"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                    />
                </svg>
            {/if}
        </div>
    {/key}
</button>
