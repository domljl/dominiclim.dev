export const prefersSmoothScroll = () => {
    if (typeof window === "undefined") return false;

    return (
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
};

export const scrollBehavior = () => (prefersSmoothScroll() ? "smooth" : "auto");
