<script lang="ts">
    import { onMount, tick } from 'svelte';
    import * as THREE from 'three/src/Three.js';
    import { Text } from 'troika-three-text';
    import { parse as openTypeParse } from 'opentype.js';
    import spaceGroteskFontUrl from '@/assets/fonts/SpaceGrotesk-500.ttf?url';

    export let visible = true;
    export let onComplete: () => void = () => {};

    const label = 'Dominic Lim';
    const minDisplayMs = 4000;
    const introDelayMs = 220;
    const traceCompleteTargetMs = 2300;
    const traceDurationMs = traceCompleteTargetMs - introDelayMs;
    const revealFadeMs = minDisplayMs - traceCompleteTargetMs;
    const letterFontSize = 1.0;
    const letterSpacing = 0.02;
    const spaceWidth = 0.5;

    type LetterUnit = {
        group: THREE.Group;
        outline: Text;
        fill: Text;
        trail: THREE.Line;
        trails: { line: THREE.Line; lengths: number[]; total: number; points: THREE.Vector3[] }[];
        width: number;
        durationMs: number;
        progress: number;
        completed: boolean;
        outlinePoints: THREE.Vector3[];
        outlineLengths: number[];
        outlineTotal: number;
    };

    const exitSlideMs = 1200;

    let hostEl: HTMLDivElement | null = null;
    let canvasEl: HTMLCanvasElement | null = null;
    let isVisible = visible;
    let isExiting = false;
    let slideOut = false;
    let snapshotUrl = '';
    let exitStarted = false;
    let reducedMotion = false;
    let isDark = false;

    function getColors(dark: boolean) {
        return {
            bg: dark ? 0x02182b : 0xfdf7c3,
            text: dark ? 0xd7263d : 0xf0485f
        };
    }

    let loaded = false;
    let minElapsed = false;
    let tracingDone = false;
    let completionFired = false;

    let minTimer: ReturnType<typeof setTimeout> | null = null;
    let exitFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let textGroup: THREE.Group | null = null;
    let pointLight: THREE.PointLight | null = null;
    let disposed = false;
    let startedAt = 0;

    const letters: LetterUnit[] = [];
    $: if (!visible && isVisible) {
        tryExit();
    }

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

    function completeExit() {
        if (completionFired) return;
        completionFired = true;
        if (exitFallbackTimer) {
            clearTimeout(exitFallbackTimer);
            exitFallbackTimer = null;
        }
        isExiting = false;
        onComplete();
    }

    function tryExit() {
        if (!isVisible || exitStarted) return;
        const canHide = !visible || (loaded && minElapsed && tracingDone);
        if (!canHide) return;

        exitStarted = true;
        isVisible = false;

        if (reducedMotion) {
            disposeSceneResources();
            completeExit();
            return;
        }

        try {
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
            if (canvasEl) {
                snapshotUrl = canvasEl.toDataURL('image/png');
            }
        } catch {
            snapshotUrl = '';
        }

        disposeSceneResources();
        isExiting = true;
        void tick().then(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    slideOut = true;
                    exitFallbackTimer = setTimeout(() => completeExit(), exitSlideMs + 100);
                });
            });
        });
    }

    function onQuadrantAnimationEnd(event: AnimationEvent) {
        if (!slideOut || completionFired) return;
        if (!event.animationName.includes('quadrant-exit-tl')) return;
        completeExit();
    }

    function disposeSceneResources() {
        if (disposed) return;
        disposed = true;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;

        for (const unit of letters) {
            unit.outline.dispose();
            unit.fill.dispose();
            (unit.trail.geometry as THREE.BufferGeometry).dispose();
            (unit.trail.material as THREE.Material).dispose();
            for (const t of unit.trails) {
                (t.line.geometry as THREE.BufferGeometry).dispose();
                (t.line.material as THREE.Material).dispose();
            }
        }
        letters.length = 0;

        renderer?.dispose();
        renderer?.forceContextLoss();
        renderer = null;
        scene = null;
        camera = null;
        textGroup = null;
        pointLight = null;
    }

    function syncText(text: Text) {
        return new Promise<void>((resolve) => {
            text.sync(() => resolve());
        });
    }

    function loadOpenTypeFont(url: string): Promise<any> {
        return fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Font request failed: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then((buffer) => openTypeParse(buffer));
    }

    function sampleLine(
        points: THREE.Vector2[],
        from: THREE.Vector2,
        to: THREE.Vector2,
        minSteps = 4
    ) {
        const distance = from.distanceTo(to);
        const maxGap = 0.015;
        const steps = Math.max(minSteps, Math.ceil(distance / maxGap));
        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            points.push(new THREE.Vector2(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t));
        }
    }

    function sampleQuadratic(
        points: THREE.Vector2[],
        from: THREE.Vector2,
        cp: THREE.Vector2,
        to: THREE.Vector2
    ) {
        const estimate = from.distanceTo(cp) + cp.distanceTo(to);
        const maxGap = 0.015;
        const steps = Math.max(10, Math.ceil(estimate / maxGap));
        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            const mt = 1 - t;
            points.push(
                new THREE.Vector2(
                    mt * mt * from.x + 2 * mt * t * cp.x + t * t * to.x,
                    mt * mt * from.y + 2 * mt * t * cp.y + t * t * to.y
                )
            );
        }
    }

    function sampleCubic(
        points: THREE.Vector2[],
        from: THREE.Vector2,
        cp1: THREE.Vector2,
        cp2: THREE.Vector2,
        to: THREE.Vector2
    ) {
        const estimate = from.distanceTo(cp1) + cp1.distanceTo(cp2) + cp2.distanceTo(to);
        const maxGap = 0.015;
        const steps = Math.max(14, Math.ceil(estimate / maxGap));
        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            const mt = 1 - t;
            points.push(
                new THREE.Vector2(
                    mt * mt * mt * from.x +
                        3 * mt * mt * t * cp1.x +
                        3 * mt * t * t * cp2.x +
                        t * t * t * to.x,
                    mt * mt * mt * from.y +
                        3 * mt * mt * t * cp1.y +
                        3 * mt * t * t * cp2.y +
                        t * t * t * to.y
                )
            );
        }
    }

    function buildGlyphOutline(
        font: any,
        char: string,
        fontSize: number
    ): {
        contours: { points: THREE.Vector3[]; bounds: { minX: number; minY: number; maxX: number; maxY: number } }[];
        width: number;
        bounds: { minX: number; minY: number; maxX: number; maxY: number };
    } {
        const path = font.getPath(char, 0, 0, fontSize);
        const contours: THREE.Vector2[][] = [];
        let current: THREE.Vector2[] = [];
        let pen = new THREE.Vector2(0, 0);
        let start = new THREE.Vector2(0, 0);

        for (const command of path.commands as any[]) {
            const type = command.type;
            if (type === 'M') {
                if (current.length > 2) contours.push(current);
                current = [];
                pen = new THREE.Vector2(command.x ?? 0, command.y ?? 0);
                start = pen.clone();
                current.push(pen.clone());
            } else if (type === 'L') {
                const to = new THREE.Vector2(command.x ?? pen.x, command.y ?? pen.y);
                sampleLine(current, pen, to);
                pen = to;
            } else if (type === 'Q') {
                const cp = new THREE.Vector2(command.x1 ?? pen.x, command.y1 ?? pen.y);
                const to = new THREE.Vector2(command.x ?? pen.x, command.y ?? pen.y);
                sampleQuadratic(current, pen, cp, to);
                pen = to;
            } else if (type === 'C') {
                const cp1 = new THREE.Vector2(command.x1 ?? pen.x, command.y1 ?? pen.y);
                const cp2 = new THREE.Vector2(command.x2 ?? pen.x, command.y2 ?? pen.y);
                const to = new THREE.Vector2(command.x ?? pen.x, command.y ?? pen.y);
                sampleCubic(current, pen, cp1, cp2, to);
                pen = to;
            } else if (type === 'Z') {
                if (current.length > 0) {
                    sampleLine(current, pen, start, 3);
                }
                if (current.length > 2) contours.push(current);
                current = [];
            }
        }
        if (current.length > 2) contours.push(current);

        const contourPerimeter = (contour: THREE.Vector2[]) => {
            let total = 0;
            for (let i = 1; i < contour.length; i += 1) {
                total += contour[i - 1].distanceTo(contour[i]);
            }
            return total;
        };

        const validContours = contours.filter((c) => c.length >= 2);
        if (validContours.length === 0) {
            const dummy: THREE.Vector2[] = [
                new THREE.Vector2(0, 0), new THREE.Vector2(1, 0),
                new THREE.Vector2(1, 1), new THREE.Vector2(0, 1), new THREE.Vector2(0, 0)
            ];
            validContours.push(dummy);
        }

        const sorted = validContours.sort((a, b) => contourPerimeter(b) - contourPerimeter(a));

        let globalMinX = Number.POSITIVE_INFINITY;
        let globalMinY = Number.POSITIVE_INFINITY;
        let globalMaxX = Number.NEGATIVE_INFINITY;
        let globalMaxY = Number.NEGATIVE_INFINITY;
        for (const contour of sorted) {
            for (const p of contour) {
                globalMinX = Math.min(globalMinX, p.x);
                globalMinY = Math.min(globalMinY, p.y);
                globalMaxX = Math.max(globalMaxX, p.x);
                globalMaxY = Math.max(globalMaxY, p.y);
            }
        }
        if (!Number.isFinite(globalMinX)) { globalMinX = 0; globalMinY = 0; globalMaxX = 1; globalMaxY = 1; }

        const centerY = (globalMinY + globalMaxY) / 2;
        const width = Math.max(0.1, font.getAdvanceWidth(char, fontSize));

        const perContour = sorted.map((contour) => {
            let cMinX = Number.POSITIVE_INFINITY, cMinY = Number.POSITIVE_INFINITY;
            let cMaxX = Number.NEGATIVE_INFINITY, cMaxY = Number.NEGATIVE_INFINITY;
            for (const p of contour) {
                cMinX = Math.min(cMinX, p.x);
                cMinY = Math.min(cMinY, p.y);
                cMaxX = Math.max(cMaxX, p.x);
                cMaxY = Math.max(cMaxY, p.y);
            }
            const points3D = contour.map((p) => new THREE.Vector3(p.x, centerY - p.y, 0));
            return {
                points: points3D,
                bounds: { minX: cMinX, minY: centerY - cMaxY, maxX: cMaxX, maxY: centerY - cMinY }
            };
        });

        return {
            contours: perContour,
            width,
            bounds: { minX: globalMinX, minY: centerY - globalMaxY, maxX: globalMaxX, maxY: centerY - globalMinY }
        };
    }

    function buildLengthTable(points: THREE.Vector3[]) {
        const lengths: number[] = [0];
        let total = 0;
        for (let i = 1; i < points.length; i += 1) {
            total += points[i - 1].distanceTo(points[i]);
            lengths.push(total);
        }
        return { lengths, total: Math.max(total, 1e-6) };
    }

    function mapPointsToBounds(
        points: THREE.Vector3[],
        source: { minX: number; minY: number; maxX: number; maxY: number },
        target: { minX: number; minY: number; maxX: number; maxY: number }
    ) {
        const srcW = Math.max(1e-6, source.maxX - source.minX);
        const srcH = Math.max(1e-6, source.maxY - source.minY);
        const dstW = Math.max(1e-6, target.maxX - target.minX);
        const dstH = Math.max(1e-6, target.maxY - target.minY);
        const sx = dstW / srcW;
        const sy = dstH / srcH;
        return points.map(
            (p) =>
                new THREE.Vector3(
                    target.minX + (p.x - source.minX) * sx,
                    target.minY + (p.y - source.minY) * sy,
                    p.z
                )
        );
    }

    function rotateClosedPoints(points: THREE.Vector3[], startRatio: number) {
        if (points.length < 3) return points;
        const normalized = [...points];
        if (normalized[0].distanceTo(normalized[normalized.length - 1]) < 1e-6) {
            normalized.pop();
        }
        if (normalized.length < 2) return points;

        const startIndex = Math.max(
            0,
            Math.min(normalized.length - 1, Math.floor(startRatio * normalized.length))
        );
        const rotated = [...normalized.slice(startIndex), ...normalized.slice(0, startIndex)];
        rotated.push(rotated[0].clone());
        return rotated;
    }

    function updateProjection() {
        if (!renderer || !camera || !hostEl) return;
        const width = hostEl.clientWidth || window.innerWidth;
        const height = hostEl.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);
    }

    function animate(now: number) {
        if (!renderer || !scene || !camera || disposed) return;

        if (reducedMotion) {
            for (const unit of letters) {
                const fillMat = unit.fill.material as THREE.Material & { opacity?: number; transparent?: boolean };
                if (fillMat) {
                    fillMat.transparent = true;
                    fillMat.opacity = 1;
                }
            }
            tracingDone = true;
            tryExit();
            renderer.render(scene, camera);
            return;
        }

        const elapsedMs = now - startedAt;
        const elapsedTrace = Math.max(0, elapsedMs - introDelayMs);
        const revealRaw = clamp01((elapsedMs - traceCompleteTargetMs) / revealFadeMs);
        let allComplete = true;

        for (const unit of letters) {
            if (!unit.completed) {
                const linear = clamp01(elapsedTrace / unit.durationMs);
                unit.progress = linear;
                unit.completed = unit.progress >= 1;
            }
            const eased = unit.progress;

            const fillMat = unit.fill.material as THREE.Material & { opacity?: number; transparent?: boolean };
            if (fillMat) {
                fillMat.transparent = true;
                fillMat.opacity = revealRaw;
            }

            for (const t of unit.trails) {
                const tGeom = t.line.geometry as THREE.BufferGeometry;
                const targetDist = eased * t.total;
                let trailCount = 0;
                for (let i = 0; i < t.lengths.length; i++) {
                    if (t.lengths[i] <= targetDist) trailCount = i + 1;
                    else break;
                }
                trailCount = Math.max(2, Math.min(t.points.length, trailCount));
                tGeom.setDrawRange(0, trailCount);
                t.line.visible = true;
            }
            unit.trail.visible = true;

            if (!unit.completed) allComplete = false;
        }

        if (allComplete && !tracingDone) {
            tracingDone = true;
            tryExit();
        }

        if (!allComplete || revealRaw < 1) {
            rafId = requestAnimationFrame(animate);
        }

        renderer.render(scene, camera);

    }

    onMount(() => {
        if (!canvasEl || !hostEl) return;

        const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        isDark = darkQuery.matches;
        const onThemeChange = (e: MediaQueryListEvent) => {
            isDark = e.matches;
            if (renderer) {
                const newBg = isDark ? 0x02182b : 0xfdf7c3;
                renderer.setClearColor(newBg, 1);
            }
            const newText = isDark ? 0xd7263d : 0xf0485f;
            const newOutline = newText;
            for (const unit of letters) {
                unit.outline.color = newOutline;
                unit.outline.strokeColor = newOutline;
                unit.fill.color = newText;
                for (const t of unit.trails) {
                    const mat = t.line.material as THREE.LineBasicMaterial;
                    mat.color.set(newOutline);
                }
            }
            if (renderer && scene && camera) renderer.render(scene, camera);
        };
        darkQuery.addEventListener('change', onThemeChange);

        reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const onLoad = () => {
            loaded = true;
            tryExit();
        };

        if (document.readyState === 'complete') {
            loaded = true;
        } else {
            window.addEventListener('load', onLoad, { once: true });
        }

        minTimer = setTimeout(() => {
            minElapsed = true;
            tryExit();
        }, minDisplayMs);

        renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(getColors(isDark).bg, 1);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(0, 0, 9);

        const ambient = new THREE.AmbientLight(0xffffff, 0.45);
        scene.add(ambient);

        pointLight = new THREE.PointLight(0x38bdf8, 2.2, 30, 2);
        pointLight.position.set(0, 0, 2.8);
        scene.add(pointLight);

        textGroup = new THREE.Group();
        scene.add(textGroup);

        void (async () => {
            let font: any;
            try {
                font = await loadOpenTypeFont(spaceGroteskFontUrl);
            } catch (error) {
                console.error('Failed to load font outline data for loader:', error);
                tracingDone = true;
                tryExit();
                if (renderer && scene && camera) renderer.render(scene, camera);
                return;
            }
            if (disposed) return;

            let cursor = 0;
            for (const char of Array.from(label)) {
                if (disposed || !textGroup || !scene) return;
                if (char === ' ') {
                    cursor += spaceWidth;
                    continue;
                }

                const outline = new Text();
                outline.text = char;
                outline.font = spaceGroteskFontUrl;
                outline.fontSize = letterFontSize;
                outline.anchorX = 'left';
                outline.anchorY = 'middle';
                const _colors = getColors(isDark);
                outline.color = _colors.text;
                outline.fillOpacity = 0;
                outline.strokeWidth = 0.045;
                outline.strokeColor = _colors.text;
                outline.strokeOpacity = 0;

                const fill = new Text();
                fill.text = char;
                fill.font = spaceGroteskFontUrl;
                fill.fontSize = letterFontSize;
                fill.anchorX = 'left';
                fill.anchorY = 'middle';
                fill.color = _colors.text;
                fill.fillOpacity = 1;

                const group = new THREE.Group();
                group.position.set(cursor, 0, 0);
                group.add(outline);
                group.add(fill);
                textGroup.add(group);

                await Promise.all([syncText(outline), syncText(fill)]);
                if (disposed) return;

                const fillMat = fill.material as THREE.Material & { opacity?: number; transparent?: boolean };
                if (fillMat) {
                    fillMat.transparent = true;
                    fillMat.opacity = 0;
                }

                const glyph = buildGlyphOutline(font, char, letterFontSize);
                const troikaBoundsArr = fill.textRenderInfo?.blockBounds ?? [
                    glyph.bounds.minX,
                    glyph.bounds.minY,
                    glyph.bounds.maxX,
                    glyph.bounds.maxY
                ];
                const troikaBounds = {
                    minX: troikaBoundsArr[0],
                    minY: troikaBoundsArr[1],
                    maxX: troikaBoundsArr[2],
                    maxY: troikaBoundsArr[3]
                };
                const troikaGlyphBoundsArr = (fill.textRenderInfo as any)?.glyphBounds as
                    | ArrayLike<number>
                    | undefined;
                const troikaGlyphBounds =
                    troikaGlyphBoundsArr && troikaGlyphBoundsArr.length >= 4
                        ? {
                              minX: troikaGlyphBoundsArr[0],
                              minY: troikaGlyphBoundsArr[1],
                              maxX: troikaGlyphBoundsArr[2],
                              maxY: troikaGlyphBoundsArr[3]
                          }
                        : null;
                const troikaVisibleBoundsArr = (fill.textRenderInfo as any)?.visibleBounds as
                    | ArrayLike<number>
                    | undefined;
                const troikaVisibleBounds =
                    troikaVisibleBoundsArr && troikaVisibleBoundsArr.length >= 4
                        ? {
                              minX: troikaVisibleBoundsArr[0],
                              minY: troikaVisibleBoundsArr[1],
                              maxX: troikaVisibleBoundsArr[2],
                              maxY: troikaVisibleBoundsArr[3]
                          }
                        : null;
                const mappingTargetBounds = troikaVisibleBounds ?? troikaGlyphBounds ?? troikaBounds;
                const optLeft = mappingTargetBounds.minX;
                const optRight = mappingTargetBounds.maxX;
                const width = Math.max(0.1, optRight - optLeft);
                group.position.x = cursor - optLeft;

                const trails: LetterUnit['trails'] = [];
                let longestTotal = 0;
                let allFlatPoints: THREE.Vector3[] = [];
                let allFlatLengths: number[] = [];
                for (const contour of glyph.contours) {
                    const cAligned = mapPointsToBounds(contour.points, glyph.bounds, mappingTargetBounds);
                    const { lengths, total } = buildLengthTable(cAligned);
                    const tGeom = new THREE.BufferGeometry().setFromPoints(cAligned);
                    tGeom.setDrawRange(0, 0);
                    const tMat = new THREE.LineBasicMaterial({
                        color: _colors.text, transparent: true, opacity: 0.6,
                        depthTest: false, depthWrite: false
                    });
                    const tLine = new THREE.Line(tGeom, tMat);
                    tLine.visible = false;
                    group.add(tLine);
                    trails.push({ line: tLine, lengths, total, points: cAligned });
                    longestTotal = Math.max(longestTotal, total);
                    allFlatPoints = allFlatPoints.concat(cAligned);
                    allFlatLengths = allFlatLengths.concat(lengths.map((l) => l + (allFlatLengths.length > 0 ? allFlatLengths[allFlatLengths.length - 1] : 0)));
                }

                const dummyGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0)]);
                dummyGeom.setDrawRange(0, 0);
                const dummyTrail = new THREE.Line(dummyGeom, new THREE.LineBasicMaterial({ visible: false }));

                letters.push({
                    group,
                    outline,
                    fill,
                    trail: dummyTrail,
                    trails,
                    width,
                    durationMs: traceDurationMs,
                    progress: 0,
                    completed: false,
                    outlinePoints: allFlatPoints,
                    outlineLengths: allFlatLengths,
                    outlineTotal: longestTotal
                });

                cursor += width + letterSpacing;
            }

            if (!textGroup || disposed) return;

            const totalWidth = Math.max(0, cursor - letterSpacing);
            textGroup.position.x = -totalWidth / 2;
            textGroup.position.y = 0;

            updateProjection();
            startedAt = performance.now();
            rafId = requestAnimationFrame(animate);
        })();

        const onResize = () => updateProjection();
        window.addEventListener('resize', onResize);
        updateProjection();

        return () => {
            darkQuery.removeEventListener('change', onThemeChange);
            window.removeEventListener('load', onLoad);
            window.removeEventListener('resize', onResize);
            if (minTimer) clearTimeout(minTimer);
            if (exitFallbackTimer) clearTimeout(exitFallbackTimer);
            disposeSceneResources();
        };
    });
</script>

{#if isVisible || isExiting}
<div
    bind:this={hostEl}
    class="fixed inset-0 z-9999 bg-[#FDF7C3] dark:bg-[#02182B] {isExiting ? 'pointer-events-none bg-transparent!' : ''}"
    aria-hidden={slideOut}
>
    {#if !isExiting}
        <canvas bind:this={canvasEl} class="h-full w-full"></canvas>
    {:else}
        <div
            class="absolute top-0 left-0 h-1/2 w-1/2 overflow-hidden bg-[#FDF7C3] will-change-transform dark:bg-[#02182B] {slideOut ? 'animate-quadrant-exit-tl' : ''}"
            on:animationend={onQuadrantAnimationEnd}
        >
            {#if snapshotUrl}
                <div
                    class="absolute top-0 left-0 h-[200%] w-[200%] bg-size-[100%_100%] bg-no-repeat"
                    style="background-image: url({snapshotUrl})"
                ></div>
            {/if}
        </div>
        <div
            class="absolute top-0 right-0 h-1/2 w-1/2 overflow-hidden bg-[#FDF7C3] will-change-transform dark:bg-[#02182B] {slideOut ? 'animate-quadrant-exit-tr' : ''}"
        >
            {#if snapshotUrl}
                <div
                    class="absolute top-0 right-0 h-[200%] w-[200%] bg-size-[100%_100%] bg-no-repeat"
                    style="background-image: url({snapshotUrl})"
                ></div>
            {/if}
        </div>
        <div
            class="absolute bottom-0 left-0 h-1/2 w-1/2 overflow-hidden bg-[#FDF7C3] will-change-transform dark:bg-[#02182B] {slideOut ? 'animate-quadrant-exit-bl' : ''}"
        >
            {#if snapshotUrl}
                <div
                    class="absolute bottom-0 left-0 h-[200%] w-[200%] bg-size-[100%_100%] bg-no-repeat"
                    style="background-image: url({snapshotUrl})"
                ></div>
            {/if}
        </div>
        <div
            class="absolute right-0 bottom-0 h-1/2 w-1/2 overflow-hidden bg-[#FDF7C3] will-change-transform dark:bg-[#02182B] {slideOut ? 'animate-quadrant-exit-br' : ''}"
        >
            {#if snapshotUrl}
                <div
                    class="absolute right-0 bottom-0 h-[200%] w-[200%] bg-size-[100%_100%] bg-no-repeat"
                    style="background-image: url({snapshotUrl})"
                ></div>
            {/if}
        </div>
    {/if}
</div>
{/if}