<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import Logo from "@/components/Logo.svelte";
    import ScrollIndicator from "@/components/ScrollIndicator.svelte";

    const phrases = ["Aspiring Software Engineer", "Problem Solver", "Challenge Seeker"] as const;

    const longestPhrase = phrases.reduce((longest, phrase) =>
        phrase.length > longest.length ? phrase : longest,
    );

    const typewriterCursor = "ml-0.5 inline-block h-[1em] w-[0.65em] shrink-0 translate-y-[0.08em] align-baseline bg-current";
    const typewriterCursorActive = `${typewriterCursor} animate-pulse motion-reduce:animate-none`;
    const typeMs = 70;
    const pauseMs = 2000;
    const deleteMs = 45;
    const phraseGapMs = 300;

    type TypewriterPhase = "typing" | "paused" | "deleting";

    let displayText = $state("");
    let phraseIndex = 0;
    let charIndex = 0;
    let phase: TypewriterPhase = "typing";
    let reducedMotion = $state(false);
    let typewriterActive = $state(false);

    let typewriterTimer: ReturnType<typeof setTimeout> | null = null;

    const clearTypewriterTimer = () => {
        if (typewriterTimer) {
            clearTimeout(typewriterTimer);
            typewriterTimer = null;
        }
    };

    const scheduleTypewriter = (delay: number, fn: () => void) => {
        clearTypewriterTimer();
        typewriterTimer = setTimeout(fn, delay);
    };

    const tickTypewriter = () => {
        const currentPhrase = phrases[phraseIndex];

        if (phase === "typing") {
            charIndex += 1;
            displayText = currentPhrase.slice(0, charIndex);

            if (charIndex >= currentPhrase.length) {
                phase = "paused";
                scheduleTypewriter(pauseMs, tickTypewriter);
                return;
            }

            scheduleTypewriter(typeMs, tickTypewriter);
            return;
        }

        if (phase === "paused") {
            phase = "deleting";
            scheduleTypewriter(deleteMs, tickTypewriter);
            return;
        }

        charIndex -= 1;
        displayText = currentPhrase.slice(0, charIndex);

        if (charIndex <= 0) {
            phraseIndex = (phraseIndex + 1) % phrases.length;
            phase = "typing";
            scheduleTypewriter(phraseGapMs, tickTypewriter);
            return;
        }

        scheduleTypewriter(deleteMs, tickTypewriter);
    };

    const startTypewriter = () => {
        if (reducedMotion) {
            displayText = phrases[0];
            return;
        }

        phraseIndex = 0;
        charIndex = 0;
        phase = "typing";
        displayText = "";
        typewriterActive = true;
        scheduleTypewriter(phraseGapMs, tickTypewriter);
    };

    onMount(() => {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        startTypewriter();
    });

    onDestroy(() => {
        clearTypewriterTimer();
    });
</script>

<section class="relative h-dvh min-h-screen" aria-label="Introduction">
    <div class="flex h-full items-center justify-center px-6 py-8">
        <div
            class="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:gap-12 md:text-left"
        >
            <Logo
                aria-hidden="true"
                class="h-48 w-48 shrink-0 text-black sm:h-64 sm:w-64 md:h-80 md:w-80 lg:h-96 lg:w-96 dark:text-white"
            />

            <div class="flex flex-col items-center gap-2 md:items-start md:gap-4">
                <h1
                    class="m-0 text-5xl leading-tight font-medium tracking-tight text-(--foreground) md:text-6xl lg:text-7xl"
                >
                    Dominic Lim
                </h1>

                <p
                    class="m-0 grid min-h-[1.5em] text-lg font-medium text-(--accent) sm:text-xl md:text-2xl"
                    aria-live="polite"
                >
                    <span class="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden="true">
                        I'm a {longestPhrase}<span class={typewriterCursor}></span>
                    </span>
                    <span class="col-start-1 row-start-1 whitespace-nowrap">
                        I'm a {displayText}{#if typewriterActive && !reducedMotion}<span
                                class={typewriterCursorActive}
                                aria-hidden="true"
                            ></span>{/if}
                    </span>
                </p>
            </div>
        </div>
    </div>

    <ScrollIndicator />
</section>
