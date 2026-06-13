<script lang="ts">
    import ArchitectureDiagram from "@/components/project-illustrations/ArchitectureDiagram.svelte";
    import type { SVGAttributes } from "svelte/elements";

    type Props = SVGAttributes<SVGElement>;

    let { class: className = "", ...restProps }: Props = $props();
</script>

<ArchitectureDiagram
    uid="kinegit"
    title="KineGit architecture illustration"
    inputLabel="Member UI"
    processorLabel="Web Server"
    outputTopLabel="Book Class"
    outputBottomLabel="MySQL"
    inputIcon="browser"
    outputTopIcon="check"
    outputBottomIcon="database"
    class={className}
    {...restProps}
/>
