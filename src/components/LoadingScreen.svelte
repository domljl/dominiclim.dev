<script lang="ts">
    import { onMount, tick } from "svelte";
    import {
        BufferAttribute,
        BufferGeometry,
        Group,
        Line,
        LineBasicMaterial,
        Material,
        PerspectiveCamera,
        Points,
        PointsMaterial,
        Scene,
        SRGBColorSpace,
        Vector2,
        Vector3,
        WebGLRenderer,
    } from "three";
    import { Text } from "troika-three-text";
    import * as opentype from "opentype.js/dist/opentype.mjs";
    import type { Font } from "opentype.js";
    import spaceGroteskFontUrl from "@/assets/fonts/SpaceGrotesk-500.ttf?url";
    import { getThemeColors, subscribeToColorScheme } from "@/lib/theme";

    export let visible = true;

    const label = "Dominic Lim";
    const minDisplayMs = 3150;
    const introDelayMs = 220;
    const traceCompleteTargetMs = 2300;
    const traceDurationMs = traceCompleteTargetMs - introDelayMs;
    const revealFadeMs = minDisplayMs - traceCompleteTargetMs;
    const letterFontSize = 1.0;
    const letterSpacing = 0.02;
    const spaceWidth = 0.5;
    const exitPushMs = 600;
    const exitScatterMs = 2800;
    const exitTotalMs = exitPushMs + exitScatterMs;
    const exitScaleBoost = 1.08;
    const exitParticleCount = 400;
    const exitParticleSpeed = 0.32;
    const exitParticleMinSize = 3.5;
    const exitParticleMaxSize = 11;
    const exitParticleFadeStart = 0.7;
    const exitHostFadeStart = exitPushMs;
    const viewportPaddingX = 0.1;
    const viewportPaddingY = 0.14;

    type ExitPhase = "idle" | "push" | "scatter" | "fade" | "done";
    type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

    type LetterUnit = {
        group: Group;
        fill: Text;
        trails: { line: Line; lengths: number[]; total: number }[];
        width: number;
        durationMs: number;
        progress: number;
        completed: boolean;
    };

    type GlyphOutline = {
        contours: { points: Vector3[]; bounds: Bounds }[];
        width: number;
        bounds: Bounds;
    };

    type LetterJob = { kind: "space" } | { kind: "letter"; char: string; fill: Text };

    let hostEl: HTMLDivElement | null = null;
    let canvasEl: HTMLCanvasElement | null = null;
    let isVisible = visible;
    let isAnimatingExit = false;
    let hostOpacity = 1;
    let exitStarted = false;
    let exitPhase: ExitPhase = "idle";
    let exitStartedAt = 0;
    let exitTextBaseY = 0;
    let exitTextBaseScale = 1;
    let particlesSpawned = false;
    let reducedMotion = false;
    let isDark = false;

    let loaded = false;
    let minElapsed = false;
    let tracingDone = false;
    let completionFired = false;

    let minTimer: ReturnType<typeof setTimeout> | null = null;
    let exitFallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    let renderer: WebGLRenderer | null = null;
    let scene: Scene | null = null;
    let camera: PerspectiveCamera | null = null;
    let textGroup: Group | null = null;
    let trailMaterial: LineBasicMaterial | null = null;
    let particles: Points | null = null;
    let particleMaterial: PointsMaterial | null = null;
    let particleVelocities: Float32Array | null = null;
    let labelCenter = new Vector3();
    let labelWidth = 0;
    let labelHeight = letterFontSize;
    let disposed = false;
    let startedAt = 0;
    let lastFrameTime = 0;

    const letters: LetterUnit[] = [];
    const glyphCache = new Map<string, GlyphOutline>();

    $: if (!visible && isVisible) {
        tryExit();
    }

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    function makeExitCanvasTransparent() {
        if (!renderer) return;
        const colors = getThemeColors(isDark);
        renderer.setClearColor(colors.bg, 0);
    }

    function completeExit() {
        if (completionFired) return;
        completionFired = true;
        if (exitFallbackTimer) {
            clearTimeout(exitFallbackTimer);
            exitFallbackTimer = null;
        }
        exitPhase = "done";
        isAnimatingExit = false;
        isVisible = false;
        hostOpacity = 0;
    }

    function finishExitAnimation() {
        if (completionFired || disposed) return;
        completeExit();
        requestAnimationFrame(() => disposeSceneResources());
    }

    function tryExit() {
        if (!isVisible || exitStarted) return;
        const canHide = !visible || (loaded && minElapsed && tracingDone);
        if (!canHide) return;

        exitStarted = true;
        isAnimatingExit = true;

        if (reducedMotion) {
            disposeSceneResources();
            completeExit();
            return;
        }

        exitPhase = "push";
        exitStartedAt = performance.now();
        hostOpacity = 1;
        particlesSpawned = false;
        exitTextBaseY = textGroup?.position.y ?? 0;
        exitTextBaseScale = textGroup?.scale.x ?? 1;

        exitFallbackTimer = setTimeout(() => finishExitAnimation(), exitTotalMs);

        if (rafId === null) {
            rafId = requestAnimationFrame(animate);
        }
    }

    function getResponsiveParticleSize() {
        const width = hostEl?.clientWidth || window.innerWidth;
        const height = hostEl?.clientHeight || window.innerHeight;
        const minDim = Math.min(width, height);
        const viewportSize = clamp01((minDim - 320) / 880);
        const textScale = textGroup?.scale.x ?? 1;
        const base = exitParticleMinSize + viewportSize * (exitParticleMaxSize - exitParticleMinSize);
        return Math.max(exitParticleMinSize, base * (0.65 + 0.35 * textScale));
    }

    function spawnParticles() {
        if (!scene || !textGroup || particlesSpawned) return;
        particlesSpawned = true;
        makeExitCanvasTransparent();

        labelCenter.copy(getLabelCenterLocal());
        textGroup.localToWorld(labelCenter);

        const worldPoints: Vector3[] = [];
        const temp = new Vector3();

        for (const unit of letters) {
            for (const t of unit.trails) {
                const geom = t.line.geometry as BufferGeometry;
                const pos = geom.getAttribute("position");
                for (let i = 0; i < pos.count; i += 1) {
                    temp.fromBufferAttribute(pos, i);
                    unit.group.localToWorld(temp);
                    worldPoints.push(temp.clone());
                }
            }
        }

        if (worldPoints.length === 0) return;

        const count = Math.min(exitParticleCount, worldPoints.length);
        const step = Math.max(1, Math.floor(worldPoints.length / count));
        const positions = new Float32Array(count * 3);
        particleVelocities = new Float32Array(count * 3);

        let particleIndex = 0;
        for (let i = 0; i < worldPoints.length && particleIndex < count; i += step) {
            const p = worldPoints[i];
            const idx = particleIndex * 3;
            positions[idx] = p.x;
            positions[idx + 1] = p.y;
            positions[idx + 2] = p.z;

            const dir = p.clone().sub(labelCenter);
            if (dir.lengthSq() < 1e-6) {
                dir.set(Math.random() - 0.5, Math.random() - 0.5, 0);
            }
            dir.normalize().multiplyScalar(exitParticleSpeed * (0.75 + Math.random() * 0.5));
            particleVelocities[idx] = dir.x;
            particleVelocities[idx + 1] = dir.y;
            particleVelocities[idx + 2] = dir.z;
            particleIndex += 1;
        }

        if (particleIndex === 0) return;

        const geom = new BufferGeometry();
        geom.setAttribute("position", new BufferAttribute(positions.slice(0, particleIndex * 3), 3));
        particleVelocities = particleVelocities.slice(0, particleIndex * 3);

        const colors = getThemeColors(isDark);
        particleMaterial = new PointsMaterial({
            color: colors.text,
            size: getResponsiveParticleSize(),
            sizeAttenuation: false,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            depthTest: false,
        });

        particles = new Points(geom, particleMaterial);
        scene.add(particles);

        for (const unit of letters) {
            const fillMat = unit.fill.material as Material & { opacity?: number };
            if (fillMat) fillMat.opacity = 0;
            unit.fill.visible = false;
            for (const t of unit.trails) {
                t.line.visible = false;
            }
        }
        if (trailMaterial) trailMaterial.opacity = 0;
    }

    function applyHostFade(exitElapsed: number) {
        const fadeDuration = exitTotalMs - exitHostFadeStart;
        if (exitElapsed < exitHostFadeStart) return 0;
        return easeOut(clamp01((exitElapsed - exitHostFadeStart) / fadeDuration));
    }

    function applyParticleFade(exitElapsed: number) {
        const fadeWindowStart = exitPushMs + exitScatterMs * exitParticleFadeStart;
        const fadeDuration = exitTotalMs - fadeWindowStart;
        if (exitElapsed < fadeWindowStart) return 0;
        return easeOut(clamp01((exitElapsed - fadeWindowStart) / fadeDuration));
    }

    function updateParticlePositions(deltaMs: number) {
        if (!particles || !particleVelocities || !particleMaterial) return;
        const posAttr = particles.geometry.getAttribute("position") as BufferAttribute;
        const dt = Math.min(deltaMs, 32) / 16.67;
        for (let i = 0; i < posAttr.count; i += 1) {
            posAttr.setX(i, posAttr.getX(i) + particleVelocities[i * 3] * dt);
            posAttr.setY(i, posAttr.getY(i) + particleVelocities[i * 3 + 1] * dt);
            posAttr.setZ(i, posAttr.getZ(i) + particleVelocities[i * 3 + 2] * dt);
        }
        posAttr.needsUpdate = true;
    }

    function applyExitFade(exitElapsed: number) {
        const hostFade = applyHostFade(exitElapsed);
        hostOpacity = 1 - hostFade;
        const particleOpacity = particleMaterial ? 1 - applyParticleFade(exitElapsed) : 1;
        if (particleMaterial) particleMaterial.opacity = particleOpacity;
        return hostFade;
    }

    function isHostFadeComplete(exitElapsed: number) {
        return applyHostFade(exitElapsed) >= 1;
    }

    function updateExitAnimation(now: number, deltaMs: number) {
        if (disposed || !camera || !textGroup || exitPhase === "idle" || exitPhase === "done") return;

        const exitElapsed = now - exitStartedAt;
        const scatterStart = exitPushMs;

        if (exitElapsed < scatterStart) {
            exitPhase = "push";
            const t = easeOut(clamp01(exitElapsed / exitPushMs));
            const scale = exitTextBaseScale * (1 + (exitScaleBoost - 1) * t);
            applyTextGroupScale(scale);
        } else {
            exitPhase = "scatter";
            spawnParticles();
            updateParticlePositions(deltaMs);
            applyExitFade(exitElapsed);

            if (isHostFadeComplete(exitElapsed)) {
                finishExitAnimation();
            }
        }
    }

    function disposeSceneResources() {
        if (disposed) return;
        disposed = true;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;

        for (const unit of letters) {
            unit.fill.dispose();
            for (const t of unit.trails) {
                (t.line.geometry as BufferGeometry).dispose();
            }
        }
        letters.length = 0;

        trailMaterial?.dispose();
        trailMaterial = null;

        if (particles) {
            particles.geometry.dispose();
            particleMaterial?.dispose();
            scene?.remove(particles);
            particles = null;
            particleMaterial = null;
            particleVelocities = null;
        }

        renderer?.dispose();
        renderer?.forceContextLoss();
        renderer = null;
        scene = null;
        camera = null;
        textGroup = null;
    }

    function syncText(text: Text) {
        return new Promise<void>((resolve) => {
            text.sync(() => resolve());
        });
    }

    function loadOpenTypeFont(url: string): Promise<Font> {
        return fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Font request failed: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then((buffer) => opentype.parse(buffer));
    }

    function sampleLine(points: Vector2[], from: Vector2, to: Vector2, minSteps = 4) {
        const distance = from.distanceTo(to);
        const maxGap = 0.015;
        const steps = Math.max(minSteps, Math.ceil(distance / maxGap));
        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            points.push(new Vector2(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t));
        }
    }

    function sampleQuadratic(points: Vector2[], from: Vector2, cp: Vector2, to: Vector2) {
        const estimate = from.distanceTo(cp) + cp.distanceTo(to);
        const maxGap = 0.015;
        const steps = Math.max(10, Math.ceil(estimate / maxGap));
        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            const mt = 1 - t;
            points.push(
                new Vector2(
                    mt * mt * from.x + 2 * mt * t * cp.x + t * t * to.x,
                    mt * mt * from.y + 2 * mt * t * cp.y + t * t * to.y,
                ),
            );
        }
    }

    function sampleCubic(points: Vector2[], from: Vector2, cp1: Vector2, cp2: Vector2, to: Vector2) {
        const estimate = from.distanceTo(cp1) + cp1.distanceTo(cp2) + cp2.distanceTo(to);
        const maxGap = 0.015;
        const steps = Math.max(14, Math.ceil(estimate / maxGap));
        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            const mt = 1 - t;
            points.push(
                new Vector2(
                    mt * mt * mt * from.x +
                        3 * mt * mt * t * cp1.x +
                        3 * mt * t * t * cp2.x +
                        t * t * t * to.x,
                    mt * mt * mt * from.y +
                        3 * mt * mt * t * cp1.y +
                        3 * mt * t * t * cp2.y +
                        t * t * t * to.y,
                ),
            );
        }
    }

    function buildGlyphOutline(font: Font, char: string, fontSize: number): GlyphOutline {
        const cached = glyphCache.get(char);
        if (cached) return cached;

        const path = font.getPath(char, 0, 0, fontSize);
        const contours: Vector2[][] = [];
        let current: Vector2[] = [];
        let pen = new Vector2(0, 0);
        let start = new Vector2(0, 0);

        for (const command of path.commands) {
            const type = command.type;
            if (type === "M") {
                if (current.length > 2) contours.push(current);
                current = [];
                pen = new Vector2(command.x ?? 0, command.y ?? 0);
                start = pen.clone();
                current.push(pen.clone());
            } else if (type === "L") {
                const to = new Vector2(command.x ?? pen.x, command.y ?? pen.y);
                sampleLine(current, pen, to);
                pen = to;
            } else if (type === "Q") {
                const cp = new Vector2(command.x1 ?? pen.x, command.y1 ?? pen.y);
                const to = new Vector2(command.x ?? pen.x, command.y ?? pen.y);
                sampleQuadratic(current, pen, cp, to);
                pen = to;
            } else if (type === "C") {
                const cp1 = new Vector2(command.x1 ?? pen.x, command.y1 ?? pen.y);
                const cp2 = new Vector2(command.x2 ?? pen.x, command.y2 ?? pen.y);
                const to = new Vector2(command.x ?? pen.x, command.y ?? pen.y);
                sampleCubic(current, pen, cp1, cp2, to);
                pen = to;
            } else if (type === "Z") {
                if (current.length > 0) {
                    sampleLine(current, pen, start, 3);
                }
                if (current.length > 2) contours.push(current);
                current = [];
            }
        }
        if (current.length > 2) contours.push(current);

        const contourPerimeter = (contour: Vector2[]) => {
            let total = 0;
            for (let i = 1; i < contour.length; i += 1) {
                total += contour[i - 1].distanceTo(contour[i]);
            }
            return total;
        };

        const validContours = contours.filter((c) => c.length >= 2);
        if (validContours.length === 0) {
            validContours.push([
                new Vector2(0, 0),
                new Vector2(1, 0),
                new Vector2(1, 1),
                new Vector2(0, 1),
                new Vector2(0, 0),
            ]);
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
        if (!Number.isFinite(globalMinX)) {
            globalMinX = 0;
            globalMinY = 0;
            globalMaxX = 1;
            globalMaxY = 1;
        }

        const centerY = (globalMinY + globalMaxY) / 2;
        const width = Math.max(0.1, font.getAdvanceWidth(char, fontSize));

        const perContour = sorted.map((contour) => {
            let cMinX = Number.POSITIVE_INFINITY;
            let cMinY = Number.POSITIVE_INFINITY;
            let cMaxX = Number.NEGATIVE_INFINITY;
            let cMaxY = Number.NEGATIVE_INFINITY;
            for (const p of contour) {
                cMinX = Math.min(cMinX, p.x);
                cMinY = Math.min(cMinY, p.y);
                cMaxX = Math.max(cMaxX, p.x);
                cMaxY = Math.max(cMaxY, p.y);
            }
            const points3D = contour.map((p) => new Vector3(p.x, centerY - p.y, 0));
            return {
                points: points3D,
                bounds: { minX: cMinX, minY: centerY - cMaxY, maxX: cMaxX, maxY: centerY - cMinY },
            };
        });

        const result: GlyphOutline = {
            contours: perContour,
            width,
            bounds: {
                minX: globalMinX,
                minY: centerY - globalMaxY,
                maxX: globalMaxX,
                maxY: centerY - globalMinY,
            },
        };
        glyphCache.set(char, result);
        return result;
    }

    function buildLengthTable(points: Vector3[]) {
        const lengths: number[] = [0];
        let total = 0;
        for (let i = 1; i < points.length; i += 1) {
            total += points[i - 1].distanceTo(points[i]);
            lengths.push(total);
        }
        return { lengths, total: Math.max(total, 1e-6) };
    }

    function mapPointsToBounds(points: Vector3[], source: Bounds, target: Bounds) {
        const srcW = Math.max(1e-6, source.maxX - source.minX);
        const srcH = Math.max(1e-6, source.maxY - source.minY);
        const dstW = Math.max(1e-6, target.maxX - target.minX);
        const dstH = Math.max(1e-6, target.maxY - target.minY);
        const sx = dstW / srcW;
        const sy = dstH / srcH;
        return points.map(
            (p) =>
                new Vector3(
                    target.minX + (p.x - source.minX) * sx,
                    target.minY + (p.y - source.minY) * sy,
                    p.z,
                ),
        );
    }

    function boundsFromArray(arr: ArrayLike<number>): Bounds | null {
        if (arr.length < 4) return null;
        return { minX: arr[0], minY: arr[1], maxX: arr[2], maxY: arr[3] };
    }

    function getMappingBounds(fill: Text, glyph: GlyphOutline): Bounds {
        const info = fill.textRenderInfo;
        const block = boundsFromArray(info?.blockBounds ?? []);
        const glyphBounds = boundsFromArray(
            (info as { glyphBounds?: ArrayLike<number> } | undefined)?.glyphBounds ?? [],
        );
        const visibleBounds = boundsFromArray(
            (info as { visibleBounds?: ArrayLike<number> } | undefined)?.visibleBounds ?? [],
        );
        return visibleBounds ?? glyphBounds ?? block ?? glyph.bounds;
    }

    function createFillText(char: string, textColor: number) {
        const fill = new Text();
        fill.text = char;
        fill.font = spaceGroteskFontUrl;
        fill.fontSize = letterFontSize;
        fill.anchorX = "left";
        fill.anchorY = "middle";
        fill.color = textColor;
        fill.fillOpacity = 1;
        return fill;
    }

    function applyTextGroupScale(scale: number) {
        if (!textGroup) return;
        textGroup.scale.set(scale, scale, 1);
        textGroup.position.x = -(labelWidth * scale) / 2;
    }

    function getLabelCenterLocal(out = labelCenter) {
        out.set(labelWidth / 2, exitTextBaseY, 0);
        return out;
    }

    function getVisibleFrustumSize(viewportWidth: number, viewportHeight: number) {
        if (!camera) return { width: 0, height: 0 };
        const distance = camera.position.z;
        const fovRad = (camera.fov * Math.PI) / 180;
        const height = 2 * Math.tan(fovRad / 2) * distance;
        const width = height * (viewportWidth / viewportHeight);
        return { width, height };
    }

    function fitTextToViewport(viewportWidth: number, viewportHeight: number) {
        if (!textGroup || labelWidth <= 0 || labelHeight <= 0) return;

        const { width: visibleWidth, height: visibleHeight } = getVisibleFrustumSize(
            viewportWidth,
            viewportHeight,
        );
        const maxWidth = visibleWidth * (1 - viewportPaddingX * 2);
        const maxHeight = visibleHeight * (1 - viewportPaddingY * 2);
        const scale = Math.min(1, maxWidth / labelWidth, maxHeight / labelHeight);

        applyTextGroupScale(scale);
    }

    function updateProjection() {
        if (!renderer || !camera || !hostEl) return;
        const width = hostEl.clientWidth || window.innerWidth;
        const height = hostEl.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);
        fitTextToViewport(width, height);
    }

    function renderFrame() {
        if (renderer && scene && camera && !disposed) {
            renderer.render(scene, camera);
        }
    }

    function animate(now: number) {
        if (disposed) return;

        const deltaMs = lastFrameTime > 0 ? now - lastFrameTime : 16.67;
        lastFrameTime = now;

        if (!renderer || !scene || !camera) {
            if (exitStarted && !completionFired) {
                rafId = requestAnimationFrame(animate);
            }
            return;
        }

        if (reducedMotion) {
            for (const unit of letters) {
                const fillMat = unit.fill.material as Material & { opacity?: number };
                if (fillMat) fillMat.opacity = 1;
            }
            tracingDone = true;
            tryExit();
            renderFrame();
            return;
        }

        const inExit = exitPhase !== "idle" && exitPhase !== "done";
        let keepAnimating = false;

        if (inExit) {
            updateExitAnimation(now, deltaMs);
            keepAnimating = exitPhase !== "idle" && exitPhase !== "done" && !completionFired;
        } else {
            const elapsedMs = now - startedAt;
            const elapsedTrace = Math.max(0, elapsedMs - introDelayMs);
            const revealRaw = clamp01((elapsedMs - traceCompleteTargetMs) / revealFadeMs);
            let allComplete = true;

            for (const unit of letters) {
                if (!unit.completed) {
                    unit.progress = clamp01(elapsedTrace / unit.durationMs);
                    unit.completed = unit.progress >= 1;
                }

                const fillMat = unit.fill.material as Material & { opacity?: number };
                if (fillMat) fillMat.opacity = revealRaw;

                for (const t of unit.trails) {
                    const tGeom = t.line.geometry as BufferGeometry;
                    const targetDist = unit.progress * t.total;
                    let trailCount = 0;
                    for (let i = 0; i < t.lengths.length; i++) {
                        if (t.lengths[i] <= targetDist) trailCount = i + 1;
                        else break;
                    }
                    trailCount = Math.max(2, trailCount);
                    tGeom.setDrawRange(0, trailCount);
                    t.line.visible = true;
                }

                if (!unit.completed) allComplete = false;
            }

            if (allComplete && !tracingDone) {
                tracingDone = true;
                tryExit();
            }

            keepAnimating =
                !allComplete ||
                revealRaw < 1 ||
                exitPhase === "push" ||
                exitPhase === "scatter" ||
                exitPhase === "fade";
        }

        if (keepAnimating && !completionFired) {
            rafId = requestAnimationFrame(animate);
        } else {
            rafId = null;
        }

        renderFrame();
    }

    onMount(() => {
        let unsubscribeTheme: (() => void) | undefined;

        const onLoad = () => {
            loaded = true;
            tryExit();
        };

        const onResize = () => {
            updateProjection();
            renderFrame();
        };

        void (async () => {
            await tick();
            if (!canvasEl || !hostEl) return;

            unsubscribeTheme = subscribeToColorScheme((dark) => {
            isDark = dark;
            const colors = getThemeColors(isDark);
            if (renderer) renderer.setClearColor(colors.bg, 1);
            trailMaterial?.color.set(colors.text);
            for (const unit of letters) {
                unit.fill.color = colors.text;
            }
            if (renderer && scene && camera) renderer.render(scene, camera);
        });

            reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (document.readyState === "complete") {
                loaded = true;
            } else {
                window.addEventListener("load", onLoad, { once: true });
            }

            minTimer = setTimeout(() => {
                minElapsed = true;
                tryExit();
            }, minDisplayMs);

            const colors = getThemeColors(isDark);

            renderer = new WebGLRenderer({
                canvas: canvasEl,
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
            });
            renderer.outputColorSpace = SRGBColorSpace;
            renderer.setClearColor(colors.bg, 1);

            scene = new Scene();
            camera = new PerspectiveCamera(40, 1, 0.1, 100);
            camera.position.set(0, 0, 9);

            textGroup = new Group();
            scene.add(textGroup);

            trailMaterial = new LineBasicMaterial({
                color: colors.text,
                transparent: true,
                opacity: 0.6,
                depthTest: false,
                depthWrite: false,
            });

            void (async () => {
            let font: Font;
            try {
                font = await loadOpenTypeFont(spaceGroteskFontUrl);
            } catch (error) {
                console.error("Failed to load font outline data for loader:", error);
                tracingDone = true;
                tryExit();
                if (renderer && scene && camera) renderer.render(scene, camera);
                return;
            }
            if (disposed) return;

            const jobs: LetterJob[] = [];
            for (const char of label) {
                if (char === " ") {
                    jobs.push({ kind: "space" });
                    continue;
                }
                jobs.push({ kind: "letter", char, fill: createFillText(char, colors.text) });
            }

            await Promise.all(
                jobs
                    .filter((job): job is Extract<LetterJob, { kind: "letter" }> => job.kind === "letter")
                    .map((job) => syncText(job.fill)),
            );
            if (disposed) return;

            let cursor = 0;
            let labelMinY = Number.POSITIVE_INFINITY;
            let labelMaxY = Number.NEGATIVE_INFINITY;
            for (const job of jobs) {
                if (disposed || !textGroup) return;
                if (job.kind === "space") {
                    cursor += spaceWidth;
                    continue;
                }

                const { char, fill } = job;
                const fillMat = fill.material as Material & { opacity?: number; transparent?: boolean };
                if (fillMat) {
                    fillMat.transparent = true;
                    fillMat.opacity = 0;
                }

                const glyph = buildGlyphOutline(font, char, letterFontSize);
                const mappingTargetBounds = getMappingBounds(fill, glyph);
                labelMinY = Math.min(labelMinY, mappingTargetBounds.minY);
                labelMaxY = Math.max(labelMaxY, mappingTargetBounds.maxY);
                const width = Math.max(0.1, mappingTargetBounds.maxX - mappingTargetBounds.minX);

                const group = new Group();
                group.position.set(cursor - mappingTargetBounds.minX, 0, 0);
                group.add(fill);
                textGroup.add(group);

                const trails: LetterUnit["trails"] = [];
                for (const contour of glyph.contours) {
                    const aligned = mapPointsToBounds(contour.points, glyph.bounds, mappingTargetBounds);
                    const { lengths, total } = buildLengthTable(aligned);
                    const tGeom = new BufferGeometry().setFromPoints(aligned);
                    tGeom.setDrawRange(0, 0);
                    const tLine = new Line(tGeom, trailMaterial!);
                    tLine.visible = false;
                    group.add(tLine);
                    trails.push({ line: tLine, lengths, total });
                }

                letters.push({
                    group,
                    fill,
                    trails,
                    width,
                    durationMs: traceDurationMs,
                    progress: 0,
                    completed: false,
                });

                cursor += width + letterSpacing;
            }

            if (!textGroup || disposed) return;

            labelWidth = Math.max(0, cursor - letterSpacing);
            labelHeight = Math.max(letterFontSize * 0.5, labelMaxY - labelMinY);

            updateProjection();
            startedAt = performance.now();
            rafId = requestAnimationFrame(animate);
            })();

            window.addEventListener("resize", onResize);
            updateProjection();
        })();

        return () => {
            unsubscribeTheme?.();
            window.removeEventListener("load", onLoad);
            window.removeEventListener("resize", onResize);
            if (minTimer) clearTimeout(minTimer);
            if (exitFallbackTimer) clearTimeout(exitFallbackTimer);
            disposeSceneResources();
        };
    });
</script>

{#if isVisible || isAnimatingExit}
    <div bind:this={hostEl} class="fixed inset-0 z-9999 {isAnimatingExit ? 'pointer-events-none' : ''}">
        <div
            class="absolute inset-0 bg-(--background)"
            style:opacity={hostOpacity}
            aria-hidden={isAnimatingExit && hostOpacity < 0.5}
        ></div>
        <canvas bind:this={canvasEl} class="relative h-full w-full"></canvas>
    </div>
{/if}
