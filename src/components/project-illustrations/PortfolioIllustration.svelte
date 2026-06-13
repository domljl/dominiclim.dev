<script lang="ts">
    import ArchitectureDiagram from "@/components/project-illustrations/ArchitectureDiagram.svelte";
    import type { SVGAttributes } from "svelte/elements";

    type Props = SVGAttributes<SVGElement>;

    let { class: className = "", ...restProps }: Props = $props();
</script>

<ArchitectureDiagram
    uid="portfolio"
    title="dominiclim.dev architecture illustration"
    inputLabel="Browser"
    processorLabel="Astro SSG"
    outputTopLabel="Svelte Islands"
    outputBottomLabel="JSON + CDN"
    inputIcon="browser"
    outputTopIcon="islands"
    outputBottomIcon="data"
    class={className}
    {...restProps}
/>
