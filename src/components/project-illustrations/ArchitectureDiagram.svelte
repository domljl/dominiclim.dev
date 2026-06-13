<script lang="ts">
    import type { SVGAttributes } from "svelte/elements";

    export type InputIcon = "browser" | "mic" | "camera";
    export type OutputTopIcon = "check" | "islands";
    export type OutputBottomIcon = "agent" | "data" | "database";

    type Props = SVGAttributes<SVGElement> & {
        uid: string;
        title: string;
        inputLabel: string;
        processorLabel: string;
        outputTopLabel: string;
        outputBottomLabel: string;
        inputIcon?: InputIcon;
        outputTopIcon?: OutputTopIcon;
        outputBottomIcon?: OutputBottomIcon;
    };

    let {
        uid,
        title,
        inputLabel,
        processorLabel,
        outputTopLabel,
        outputBottomLabel,
        inputIcon = "browser",
        outputTopIcon = "check",
        outputBottomIcon = "data",
        class: className = "",
        ...restProps
    }: Props = $props();

    const techBlue = "#38bdf8";
    const successGreen = "#22c55e";
    const accentRed = "#ef4444";

    const pathIn = "M 260 338 L 490 338";
    const pathTop = "M 602 338 C 680 338, 680 238, 820 238";
    const pathBottom = "M 602 338 C 680 338, 680 438, 820 438";
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 675"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="{title}"
    class={className}
    {...restProps}
>
    <defs>
        <linearGradient id="{uid}-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <pattern id="{uid}-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
        </pattern>
    </defs>

    <rect width="1200" height="675" fill="url(#{uid}-bg)" rx="32" />
    <rect width="1200" height="675" fill="url(#{uid}-grid)" rx="32" />

    <path d={pathIn} stroke={techBlue} stroke-width="2" stroke-dasharray="4 4" opacity="0.5" fill="none" />
    <path d={pathTop} stroke={successGreen} stroke-width="2" stroke-dasharray="4 4" opacity="0.5" fill="none" />
    <path d={pathBottom} stroke={accentRed} stroke-width="2" stroke-dasharray="4 4" opacity="0.5" fill="none" />

    <g transform="translate(200, 338)">
        <text x="0" y="-82" fill="#94a3b8" font-size="16" font-family="monospace" text-anchor="middle" class="diagram-label">{inputLabel}</text>
        <circle r="60" fill="#1e293b" stroke={techBlue} stroke-width="2" />
        {#if inputIcon === "mic"}
            <path
                d="M -12 -20 h 24 a 12 12 0 0 1 12 12 v 16 a 12 12 0 0 1 -12 12 h -24 a 12 12 0 0 1 -12 -12 v -16 a 12 12 0 0 1 12 -12 z"
                fill="none"
                stroke={techBlue}
                stroke-width="3"
            />
            <path d="M -24 10 v 10 a 24 24 0 0 0 48 0 v -10" fill="none" stroke={techBlue} stroke-width="3" stroke-linecap="round" />
            <path d="M 0 44 v 10 M -15 54 h 30" fill="none" stroke={techBlue} stroke-width="3" stroke-linecap="round" />
        {:else if inputIcon === "camera"}
            <circle cx="0" cy="0" r="20" fill="none" stroke={techBlue} stroke-width="3" />
            <circle cx="0" cy="0" r="7" fill={techBlue} opacity="0.85" />
            <path d="M 24 -6 h 10 v 12 h -10 z" fill="none" stroke={techBlue} stroke-width="2" />
        {:else}
            <g transform="translate(0, 1)">
                <rect x="-20" y="-16" width="40" height="28" rx="4" fill="none" stroke={techBlue} stroke-width="3" />
                <path d="M -22 14 h 44" stroke={techBlue} stroke-width="3" stroke-linecap="round" />
            </g>
        {/if}
        {#each [0, 0.6, 1.2] as delay, i (i)}
            <circle r="60" fill="none" stroke={techBlue} stroke-width="2" opacity="0">
                <animate attributeName="opacity" values="0;0.5;0" dur="2s" begin="{delay}s" repeatCount="indefinite" />
                <animate attributeName="r" values="60;84;60" dur="2s" begin="{delay}s" repeatCount="indefinite" />
            </circle>
        {/each}
    </g>

    <g transform="translate(550, 338)">
        <text x="0" y="-82" fill="#94a3b8" font-size="16" font-family="monospace" text-anchor="middle" class="diagram-label">{processorLabel}</text>
        <g>
            <path d="M 0 -60 L 52 -30 L 52 30 L 0 60 L -52 30 L -52 -30 Z" fill="#1e293b" stroke={techBlue} stroke-width="2">
                <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="30s" repeatCount="indefinite" />
            </path>
        </g>
        <path d="M -20 -20 L 20 -20 L 20 20 L -20 20 Z" fill="none" stroke={techBlue} stroke-width="2" />
        <path d="M 0 -20 L 0 -40 M 0 20 L 0 40 M -20 0 L -40 0 M 20 0 L 40 0" stroke={techBlue} stroke-width="2" />
        <circle r="8" fill={techBlue} opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
    </g>

    <g transform="translate(900, 238)">
        <text x="0" y="-58" fill="#94a3b8" font-size="16" font-family="monospace" text-anchor="middle" class="diagram-label">{outputTopLabel}</text>
        <rect x="-40" y="-30" width="80" height="60" rx="8" fill="#1e293b" stroke={successGreen} stroke-width="2" />
        {#if outputTopIcon === "islands"}
            <circle cx="-14" cy="-6" r="7" fill={successGreen} opacity="0.85" />
            <circle cx="14" cy="-6" r="7" fill={successGreen} opacity="0.85" />
            <rect x="-22" y="10" width="44" height="7" rx="3.5" fill={successGreen} opacity="0.45" />
        {:else}
            <path d="M -15 0 L -5 10 L 15 -10" fill="none" stroke={successGreen} stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        {/if}
    </g>

    <g transform="translate(900, 438)">
        <text x="0" y="-68" fill="#94a3b8" font-size="16" font-family="monospace" text-anchor="middle" class="diagram-label">{outputBottomLabel}</text>
        {#if outputBottomIcon === "agent"}
            <rect x="-60" y="-45" width="120" height="90" rx="8" fill="#1e293b" stroke={accentRed} stroke-width="2" />
            <circle cx="0" cy="-10" r="15" fill={accentRed} opacity="0.8" />
            <path d="M -20 25 q 20 -10 40 0" stroke={accentRed} stroke-width="2" fill="none" />
            <circle cx="45" cy="-30" r="4" fill={successGreen}>
                <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
        {:else if outputBottomIcon === "database"}
            <rect x="-40" y="-30" width="80" height="60" rx="8" fill="#1e293b" stroke={accentRed} stroke-width="2" />
            <ellipse cx="0" cy="-10" rx="22" ry="7" fill="none" stroke={accentRed} stroke-width="2" />
            <path d="M -22 -10 v 24 c 0 4 10 7 22 7 s 22 -3 22 -7 v -24" fill="none" stroke={accentRed} stroke-width="2" />
            <path d="M -22 2 c 0 4 10 7 22 7 s 22 -3 22 -7" fill="none" stroke={accentRed} stroke-width="2" />
        {:else}
            <rect x="-40" y="-30" width="80" height="60" rx="8" fill="#1e293b" stroke={accentRed} stroke-width="2" />
            <path d="M -22 -12 h 44 M -15 0 h 30 M -19 12 h 38" stroke={accentRed} stroke-width="2" stroke-linecap="round" />
        {/if}
    </g>

    <circle r="4" fill={techBlue} opacity="0">
        <animateMotion dur="1.5s" repeatCount="indefinite" path={pathIn} />
        <animate attributeName="opacity" values="0;1;1;0" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <circle r="4" fill={successGreen} opacity="0">
        <animateMotion dur="1.5s" repeatCount="indefinite" begin="0.75s" path={pathTop} />
        <animate attributeName="opacity" values="0;1;1;0" dur="1.5s" begin="0.75s" repeatCount="indefinite" />
    </circle>
    <circle r="4" fill={accentRed} opacity="0">
        <animateMotion dur="1.5s" repeatCount="indefinite" begin="2.25s" path={pathBottom} />
        <animate attributeName="opacity" values="0;1;1;0" dur="1.5s" begin="2.25s" repeatCount="indefinite" />
    </circle>
</svg>

<style>
    @media (max-width: 639px) {
        :global(.diagram-label) {
            display: none;
        }
    }
</style>
