<script lang="ts">
    import { onMount } from "svelte";
    import type LoadingScreenComponent from "./LoadingScreen.svelte";

    let { visible = true } = $props();

    let Loader: typeof LoadingScreenComponent | null = $state(null);

    onMount(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const load = () => {
            void import("./LoadingScreen.svelte").then((mod) => {
                Loader = mod.default;
            });
        };

        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(load, { timeout: 1500 });
        } else {
            setTimeout(load, 1);
        }
    });
</script>

{#if Loader}
    <Loader {visible} />
{/if}
