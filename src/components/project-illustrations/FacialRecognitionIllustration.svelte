<script lang="ts">
    import ArchitectureDiagram from "@/components/project-illustrations/ArchitectureDiagram.svelte";
    import type { SVGAttributes } from "svelte/elements";

    type Props = SVGAttributes<SVGElement>;

    let { class: className = "", ...restProps }: Props = $props();
</script>

<ArchitectureDiagram
    uid="facial"
    title="Facial recognition authentication illustration"
    inputLabel="Webcam"
    processorLabel="FastAPI"
    outputTopLabel="Face Match"
    outputBottomLabel="JWT + SQLite"
    inputIcon="camera"
    outputTopIcon="check"
    outputBottomIcon="data"
    class={className}
    {...restProps}
/>
