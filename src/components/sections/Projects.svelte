<script lang="ts">
    import { resolveIllustration } from "@/lib/project-illustrations";
    import { projects, type Project } from "@/lib/projects";

    const entries = projects;

    const demoLabel = (demoType: Project["demoType"]) =>
        demoType === "live" ? "Live preview" : "Video demo";
</script>

<section
    id="projects"
    aria-label="Projects"
    class="relative scroll-mt-28 px-4 py-20 sm:scroll-mt-32 sm:px-6 sm:py-24"
>
    <div class="mx-auto w-full max-w-360">
        <div class="mb-8 space-y-2 sm:mb-10 sm:space-y-3">
            <p
                class="m-0 text-xs font-medium tracking-[0.2em] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] uppercase sm:text-sm sm:tracking-[0.22em]"
            >
                Portfolio
            </p>
            <h2
                class="m-0 text-4xl leading-tight font-medium tracking-tight text-(--foreground) sm:text-5xl md:text-6xl"
            >
                Projects
            </h2>
        </div>

        <div class="grid gap-4 sm:gap-5 lg:grid-cols-2">
            {#each entries as project (project.title)}
                {@render projectCard(project)}
            {/each}
        </div>
    </div>
</section>

{#snippet glassLayers()}
    <span
        class="pointer-events-none absolute inset-0 z-1 rounded-[inherit] backdrop-blur-md"
        aria-hidden="true"
    ></span>
    <span
        class="pointer-events-none absolute inset-0 z-2 rounded-[inherit] bg-white/20 dark:bg-black/20"
        aria-hidden="true"
    ></span>
    <span
        class="pointer-events-none absolute inset-0 z-3 rounded-[inherit] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.12)]"
        aria-hidden="true"
    ></span>
{/snippet}

{#snippet imagePlaceholder(title: string)}
    <div
        class="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
        aria-hidden="true"
    >
        <span
            class="text-4xl font-medium text-[color-mix(in_srgb,var(--foreground)_35%,transparent)] sm:text-5xl"
        >
            {title.charAt(0)}
        </span>
    </div>
{/snippet}

{#snippet techPills(technologies: string[])}
    <ul class="m-0 flex list-none flex-wrap gap-2">
        {#each technologies as tech (tech)}
            <li>
                <span
                    class="inline-block rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1 text-xs font-medium text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--accent)_20%,transparent)] sm:text-sm"
                >
                    {tech}
                </span>
            </li>
        {/each}
    </ul>
{/snippet}

{#snippet actionButton(
    href: string,
    label: string,
    ariaLabel: string,
    icon: "github" | "live" | "video",
)}
    <a
        {href}
        target="_blank"
        rel="noopener noreferrer"
        class="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-transparent px-5 py-2.5 text-sm text-(--foreground) no-underline shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] transition-[transform,box-shadow] duration-200 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:hover:scale-100 motion-reduce:active:scale-100 sm:text-base"
        aria-label={ariaLabel}
    >
        <span
            class="pointer-events-none absolute inset-0 z-1 rounded-[inherit] backdrop-blur-md"
            aria-hidden="true"
        ></span>
        <span
            class="pointer-events-none absolute inset-0 z-2 rounded-[inherit] bg-white/20 dark:bg-black/20"
            aria-hidden="true"
        ></span>
        <span
            class="pointer-events-none absolute inset-0 z-3 rounded-[inherit] bg-[color-mix(in_srgb,var(--accent)_0%,transparent)] transition-colors duration-200 group-hover/btn:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
            aria-hidden="true"
        ></span>

        {#if icon === "github"}
            <svg
                class="relative z-5 h-4 w-4 text-(--accent)"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
            >
                <path
                    d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
            </svg>
        {:else if icon === "live"}
            <svg
                class="relative z-5 h-4 w-4 text-(--accent)"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M7 17 17 7" />
                <path d="M9 7h8v8" />
            </svg>
        {:else}
            <svg
                class="relative z-5 h-4 w-4 text-(--accent)"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
        {/if}

        <span class="relative z-5 font-medium">{label}</span>
    </a>
{/snippet}

{#snippet projectCard(project: Project)}
    {@const Illustration = resolveIllustration(project.image)}
    <article
        class="group/card relative flex h-full flex-col overflow-hidden rounded-2xl bg-transparent shadow-[0_8px_32px_rgba(0,0,0,0.22)] ring-1 ring-[color-mix(in_srgb,var(--foreground)_12%,transparent)] transition-[box-shadow] duration-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
    >
        {@render glassLayers()}

        <div class="relative z-4 flex min-h-0 flex-1 flex-col">
            <div class="relative aspect-video shrink-0 overflow-hidden rounded-t-2xl">
                {#if Illustration}
                    <Illustration
                        class="h-full w-full transition-transform duration-300 group-hover/card:scale-[1.02] motion-reduce:group-hover/card:scale-100"
                    />
                {:else}
                    {@render imagePlaceholder(project.title)}
                {/if}
            </div>

            <div class="flex flex-1 flex-col gap-4 p-5 sm:gap-5 sm:p-6">
                <div class="space-y-2.5">
                    <h3 class="m-0 text-xl leading-tight font-medium text-(--foreground) sm:text-2xl">
                        {project.title}
                    </h3>
                    <p
                        class="m-0 text-sm leading-relaxed text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] sm:text-base"
                    >
                        {project.description}
                    </p>
                </div>

                {@render techPills(project.technologies)}

                <div class="mt-auto flex items-center justify-between gap-3 pt-2">
                    {@render actionButton(
                        project.demo,
                        demoLabel(project.demoType),
                        `${demoLabel(project.demoType)} for ${project.title}`,
                        project.demoType === "live" ? "live" : "video",
                    )}
                    {@render actionButton(
                        project.github,
                        "Source",
                        `View source code for ${project.title}`,
                        "github",
                    )}
                </div>
            </div>
        </div>
    </article>
{/snippet}
