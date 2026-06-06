import timelineData from "@/data/timeline.json";

export type TimelineEntryType = "Education" | "Experience";

interface TimelineEntryBase {
    title: string;
    titleLines?: string[];
    type: TimelineEntryType;
    link: string;
    date: string;
    logo: string;
}

export interface EducationTimelineEntry extends TimelineEntryBase {
    institution: string;
    awards?: string[];
    positions?: string[];
    events?: string[];
}

export interface WorkTimelineEntry extends TimelineEntryBase {
    company: string;
    contributions?: string[];
}

export type TimelineEntry = EducationTimelineEntry | WorkTimelineEntry;

type ImageModule = string | { src: string };

const toImageSrc = (module: ImageModule): string =>
    typeof module === "string" ? module : module.src;

const logoModules = import.meta.glob<ImageModule>("@/assets/pictures/**/*.{png,jpg,jpeg,webp}", {
    eager: true,
    import: "default",
});

const logoByPath = Object.entries(logoModules).reduce<Record<string, string>>((map, [modulePath, module]) => {
    const url = toImageSrc(module);
    const basename = modulePath.split("/").pop() ?? "";

    map[modulePath] = url;

    if (modulePath.includes("/src/")) {
        map[modulePath.replace(/^.*\/src\//, "@/")] = url;
    }

    if (modulePath.startsWith("../")) {
        map[modulePath.replace(/^\.\.\//, "@/")] = url;
    }

    if (basename) {
        map[basename] = url;
    }

    return map;
}, {});

export const timelineEntries = timelineData as TimelineEntry[];

export function isWorkEntry(entry: TimelineEntry): entry is WorkTimelineEntry {
    return "company" in entry;
}

export function getOrganization(entry: TimelineEntry): string {
    return isWorkEntry(entry) ? entry.company : entry.institution;
}

export function resolveLogo(path: string): string {
    return logoByPath[path] ?? logoByPath[path.split("/").pop() ?? ""] ?? "";
}

export function getPreviewBullets(entry: TimelineEntry, limit = 3): string[] {
    if (isWorkEntry(entry)) {
        return (entry.contributions ?? []).slice(0, limit);
    }

    return [...(entry.awards ?? []), ...(entry.positions ?? []), ...(entry.events ?? [])].slice(0, limit);
}

export interface ResumeSection {
    label: string;
    items: string[];
}

export function getResumeSections(entry: TimelineEntry): ResumeSection[] {
    if (isWorkEntry(entry)) {
        const contributions = entry.contributions ?? [];
        return contributions.length > 0 ? [{ label: "Key Contributions", items: contributions }] : [];
    }

    return [
        { label: "Awards", items: entry.awards ?? [] },
        { label: "Leadership & Roles", items: entry.positions ?? [] },
        { label: "Activities & Events", items: entry.events ?? [] },
    ].filter((section) => section.items.length > 0);
}

export function getScrollSections(entry: TimelineEntry): ResumeSection[] {
    return getResumeSections(entry)
        .map((section) => {
            if (section.label === "Activities & Events") {
                return { ...section, items: section.items.slice(0, 2) };
            }

            if (section.label === "Key Contributions") {
                return { ...section, items: section.items.slice(0, 3) };
            }

            return section;
        })
        .filter((section) => section.items.length > 0);
}
