<script lang="ts">
    import { onMount } from "svelte";
    import { cubicOut, cubicIn } from "svelte/easing";
    import { fly } from "svelte/transition";
    import ThemeToggle from "@/components/ThemeToggle.svelte";

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
    const glassCardClass =
        "relative overflow-hidden rounded-[inherit] bg-transparent shadow-[0_8px_32px_rgba(0,0,0,0.22)]";
    const navItemBase =
        "block rounded-full px-3 py-1.5 text-base font-medium whitespace-nowrap text-(--foreground) no-underline transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:px-3.5 sm:py-2 sm:text-lg";
    const navItemActive =
        "bg-[color-mix(in_srgb,var(--foreground)_18%,transparent)]";
    const mobileNavItemBase =
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-medium text-(--foreground) no-underline transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)";
    const mobileNavItemActive =
        "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-(--accent)";

    const menuPanelTransition = (node: Element) =>
        reducedMotion
            ? { duration: 0 }
            : fly(node, {
                  y: -10,
                  duration: 280,
                  easing: cubicOut,
              });

    const menuPanelOutTransition = (node: Element) =>
        reducedMotion
            ? { duration: 0 }
            : fly(node, {
                  y: -8,
                  duration: 200,
                  easing: cubicIn,
              });

    let glassCard: HTMLDivElement | undefined;
    let mobileMenuRoot: HTMLDivElement | undefined;
    let displacementMap: SVGFEDisplacementMapElement | undefined;
    let specularHighlight = $state("none");
    let reducedMotion = $state(false);
    let activeSection = $state("");
    let menuOpen = $state(false);

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

    const closeMenu = () => {
        menuOpen = false;
    };

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const handleLinkClick = () => {
        closeMenu();
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

    $effect(() => {
        if (!menuOpen) return;

        const onKeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeMenu();
        };

        const onClick = (event: MouseEvent) => {
            if (!(event.target instanceof Node) || !mobileMenuRoot) return;
            if (!mobileMenuRoot.contains(event.target)) closeMenu();
        };

        window.addEventListener("keydown", onKeydown);

        const clickTimeout = window.setTimeout(() => {
            document.addEventListener("click", onClick);
        }, 0);

        return () => {
            window.removeEventListener("keydown", onKeydown);
            window.clearTimeout(clickTimeout);
            document.removeEventListener("click", onClick);
        };
    });

    onMount(() => {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        updateActiveSection();
    });

    $effect(() => {
        if (!glassCard) return;

        glassCard.addEventListener("mousemove", handleMouseMove);
        glassCard.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            glassCard?.removeEventListener("mousemove", handleMouseMove);
            glassCard?.removeEventListener("mouseleave", handleMouseLeave);
        };
    });
</script>

{#snippet glassLayers(specular: string)}
    <div
        class="{glassLayer} z-1 backdrop-blur-xs filter-[url(#glass-distortion)_saturate(120%)_brightness(1.15)]"
        aria-hidden="true"
    ></div>
    <div class="{glassLayer} z-2 bg-white/25 dark:bg-black/25" aria-hidden="true"></div>
    <div
        class="{glassLayer} z-3 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.75)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15)]"
        style:background={specular}
        aria-hidden="true"
    ></div>
{/snippet}

<svelte:window onscroll={updateActiveSection} onresize={updateActiveSection} />

<nav aria-label="Primary" class="relative w-auto lg:w-full lg:max-w-[calc(100vw-2rem)]">
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

    <div class="hidden lg:block">
        <div bind:this={glassCard} class="{glassCardClass} w-full rounded-full">
            {@render glassLayers(specularHighlight)}

            <ul
                class="relative z-4 m-0 flex list-none items-center justify-center gap-3 px-5 py-3 sm:gap-5 sm:px-10 sm:py-4"
            >
                {#each links as link (link.href)}
                    {@const isActive = activeSection === link.href}
                    <li>
                        <a
                            href={link.href}
                            class="{navItemBase} {isActive ? navItemActive : ''}"
                            aria-current={isActive ? "location" : undefined}
                        >
                            {link.label}
                        </a>
                    </li>
                {/each}
            </ul>
        </div>
    </div>

    <div bind:this={mobileMenuRoot} class="lg:hidden">
        <button
            type="button"
            class="{glassCardClass} rounded-full transition-[box-shadow,transform] duration-300 {menuOpen
                ? 'shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-2 ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]'
                : 'hover:scale-[1.03] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100'}"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onclick={toggleMenu}
        >
            {@render glassLayers("none")}

            <span class="relative z-4 flex h-11 w-11 items-center justify-center text-(--foreground)">
                <span class="relative block h-4 w-5" aria-hidden="true">
                    <span
                        class="absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out {menuOpen
                            ? 'top-1.75 rotate-45'
                            : 'top-0'}"
                    ></span>
                    <span
                        class="absolute left-0 top-1.75 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out {menuOpen
                            ? 'scale-x-0 opacity-0'
                            : 'opacity-100'}"
                    ></span>
                    <span
                        class="absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out {menuOpen
                            ? 'top-1.75 -rotate-45'
                            : 'top-3.5'}"
                    ></span>
                </span>
            </span>
        </button>

        {#if menuOpen}
            <button
                type="button"
                class="fixed inset-0 z-40 cursor-default bg-[color-mix(in_srgb,var(--foreground)_20%,transparent)] backdrop-blur-[2px]"
                aria-label="Close menu"
                onclick={closeMenu}
                in:fly={reducedMotion ? { duration: 0 } : { y: 0, duration: 220 }}
                out:fly={reducedMotion ? { duration: 0 } : { y: 0, duration: 180 }}
            ></button>

            <div
                id="mobile-nav-menu"
                class="absolute top-[calc(100%+0.625rem)] right-0 z-50 w-64 max-w-[calc(100vw-2rem)] origin-top-right"
                in:menuPanelTransition
                out:menuPanelOutTransition
            >
                <div
                    class="{glassCardClass} overflow-hidden rounded-[1.25rem] ring-1 ring-[color-mix(in_srgb,var(--foreground)_10%,transparent)] shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
                >
                    {@render glassLayers("none")}

                    <div
                        class="relative z-4 flex items-center justify-between border-b border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] px-4 py-3"
                    >
                        <span
                            class="text-xs font-medium tracking-[0.22em] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] uppercase"
                        >
                            Navigate
                        </span>
                        <span class="h-1.5 w-1.5 rounded-full bg-(--accent)" aria-hidden="true"></span>
                    </div>

                    <ul class="relative z-4 m-0 list-none space-y-0.5 p-2">
                        {#each links as link, index (link.href)}
                            {@const isActive = activeSection === link.href}
                            <li
                                in:fly={reducedMotion
                                    ? { duration: 0 }
                                    : {
                                          y: 8,
                                          duration: 240,
                                          delay: 50 + index * 40,
                                          easing: cubicOut,
                                      }}
                            >
                                <a
                                    href={link.href}
                                    class="{mobileNavItemBase} {isActive ? mobileNavItemActive : ''}"
                                    aria-current={isActive ? "location" : undefined}
                                    onclick={handleLinkClick}
                                >
                                    <span
                                        class="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 {isActive
                                            ? 'bg-(--accent)'
                                            : 'bg-[color-mix(in_srgb,var(--foreground)_20%,transparent)]'}"
                                        aria-hidden="true"
                                    ></span>
                                    {link.label}
                                </a>
                            </li>
                        {/each}
                    </ul>

                    <div
                        class="relative z-4 border-t border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-3"
                    >
                        <p
                            class="mb-2 px-1 text-xs font-medium tracking-[0.18em] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] uppercase"
                        >
                            Appearance
                        </p>
                        <ThemeToggle embedded />
                    </div>
                </div>
            </div>
        {/if}
    </div>
</nav>
