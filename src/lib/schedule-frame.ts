const pendingCallbacks = new Set<() => void>();
let frameId = 0;

export const scheduleFrame = (callback: () => void) => {
    pendingCallbacks.add(callback);

    if (frameId) return;

    frameId = requestAnimationFrame(() => {
        frameId = 0;
        const batch = [...pendingCallbacks];
        pendingCallbacks.clear();

        for (const callback of batch) {
            callback();
        }
    });
};

export const addPassiveScrollListener = (callback: () => void) => {
    const handler = () => scheduleFrame(callback);
    window.addEventListener("scroll", handler, { passive: true });

    return () => {
        window.removeEventListener("scroll", handler);
        pendingCallbacks.delete(callback);
    };
};
