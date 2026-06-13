<script lang="ts">
    import ArchitectureDiagram from "@/components/project-illustrations/ArchitectureDiagram.svelte";
    import type { SVGAttributes } from "svelte/elements";

    type Props = SVGAttributes<SVGElement>;

    let { class: className = "", ...restProps }: Props = $props();
</script>

<ArchitectureDiagram
    uid="ocbc"
    title="OCBC Smart Banking Kiosk illustration"
    inputLabel="Voice Input"
    processorLabel="Local LLM"
    outputTopLabel="Self-Service"
    outputBottomLabel="Live Agent"
    inputIcon="mic"
    outputTopIcon="check"
    outputBottomIcon="agent"
    class={className}
    {...restProps}
/>
