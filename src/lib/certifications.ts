import certificationsData from "@/data/certifications.json";

export interface Certification {
    title: string;
    type: string;
    icon: string;
    dateOfIssue: string;
    credential: string;
    description?: string;
    skills: string[];
}

type ImageModule = string | { src: string };

const toImageSrc = (module: ImageModule): string =>
    typeof module === "string" ? module : module.src;

const iconModules = import.meta.glob<ImageModule>(
    "@/assets/pictures/certification/*.{png,jpg,jpeg,webp,svg}",
    {
        eager: true,
        import: "default",
    },
);

const iconByKey = Object.entries(iconModules).reduce<Record<string, string>>(
    (map, [modulePath, module]) => {
        const url = toImageSrc(module);
        const basename = modulePath.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";

        if (basename) {
            map[basename] = url;
            map[basename.toLowerCase()] = url;
        }

        return map;
    },
    {},
);

export const certifications = certificationsData as Certification[];

export function resolveIcon(iconKey: string): string {
    return iconByKey[iconKey] ?? iconByKey[iconKey.toLowerCase()] ?? "";
}

export function getIssuerLabel(iconKey: string): string {
    const labels: Record<string, string> = {
        harvardx: "HarvardX",
        openedg: "OpenEDG",
        hackerRank: "HackerRank",
    };

    return labels[iconKey] ?? iconKey;
}
