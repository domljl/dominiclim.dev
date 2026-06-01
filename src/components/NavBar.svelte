<script lang="ts">
    import { onMount } from "svelte";

    const links = [
        { label: "About", href: "#about" },
        { label: "Timeline", href: "#timeline" },
        { label: "Certifications", href: "#certifications" },
        { label: "Projects", href: "#projects" },
        { label: "Contact", href: "#contact" },
    ] as const;

    const sectionIds = links.map((link) => link.href.slice(1));
    const idleDisplacementScale = 77;
    const scrollOffsetRatio = 0.35;

    const glassLayer = "pointer-events-none absolute inset-0 rounded-[inherit]";
    const navItemBase =
        "block rounded-full px-3 py-1.5 text-base font-medium whitespace-nowrap text-(--foreground) no-underline transition-colors duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:px-3.5 sm:py-2 sm:text-lg";

    let glassCard: HTMLDivElement | undefined;
    let displacementMap: SVGFEDisplacementMapElement | undefined;
    let specularHighlight = $state("none");
    let reducedMotion = $state(false);
    let activeSection = $state("");

    const updateActiveSection = () => {
        const offset = window.innerHeight * scrollOffsetRatio;
        let current = "";

        for (const id of sectionIds) {
            const section = document.getElementById(id);
            if (section && section.getBoundingClientRect().top <= offset) {
                current = `#${id}`;
            }
        }

        activeSection = current;
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (reducedMotion || !glassCard || !displacementMap) return;

        const rect = glassCard.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const scaleX = (x / rect.width) * 100;
        const scaleY = (y / rect.height) * 100;
        displacementMap.setAttribute("scale", String(Math.min(scaleX, scaleY)));

        specularHighlight = `radial-gradient(
            circle at ${x}px ${y}px,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(255, 255, 255, 0) 60%
        )`;
    };

    const handleMouseLeave = () => {
        if (!displacementMap) return;

        displacementMap.setAttribute("scale", String(idleDisplacementScale));
        specularHighlight = "none";
    };

    onMount(() => {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        updateActiveSection();
    });
</script>

<svelte:window onscroll={updateActiveSection} onresize={updateActiveSection} />

<nav
    aria-label="Primary"
    class="w-full max-w-[calc(100vw-2rem)]"
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
>
    <svg class="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
            <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.015"
                    numOctaves="2"
                    seed="3"
                    result="noise"
                />
                <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
                <feDisplacementMap
                    bind:this={displacementMap}
                    in="SourceGraphic"
                    in2="blurred"
                    scale={idleDisplacementScale}
                    xChannelSelector="R"
                    yChannelSelector="G"
                />
            </filter>
        </defs>
    </svg>

    <div
        bind:this={glassCard}
        class="relative w-full overflow-hidden rounded-full bg-transparent shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
    >
        <div
            class="{glassLayer} z-[1] backdrop-blur-[4px] [filter:url(#glass-distortion)_saturate(120%)_brightness(1.15)]"
            aria-hidden="true"
        ></div>
        <div class="{glassLayer} z-[2] bg-white/25 dark:bg-black/25" aria-hidden="true"></div>
        <div
            class="{glassLayer} z-[3] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.75)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15)]"
            style:background={specularHighlight}
            aria-hidden="true"
        ></div>

        <ul
            class="relative z-[4] m-0 flex list-none items-center justify-center gap-3 px-5 py-3 sm:gap-5 sm:px-10 sm:py-4"
        >
            {#each links as link (link.href)}
                {@const isActive = activeSection === link.href}
                <li>
                    <a
                        href={link.href}
                        class="{navItemBase} {isActive ? 'bg-white/20' : ''}"
                        aria-current={isActive ? "location" : undefined}
                    >
                        {link.label}
                    </a>
                </li>
            {/each}
        </ul>
    </div>
</nav>
