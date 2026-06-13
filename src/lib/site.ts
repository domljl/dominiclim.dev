import { socialLinks } from "@/lib/contact";

export const siteConfig = {
    url: "https://dominiclim.dev",
    title: "Dominic Lim — Aspiring Software Engineer",
    shortTitle: "Dominic Lim",
    description:
        "Dominic Lim — aspiring software engineer portfolio. Passionate about coding, solving problems, and building useful projects.",
    locale: "en",
    author: "Dominic Lim",
    jobTitle: "Aspiring Software Engineer",
    ogImage: "/og-image.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: "Dominic Lim logo",
    sameAs: [socialLinks.github, socialLinks.linkedin],
} as const;

export const absoluteUrl = (path: string) => new URL(path, siteConfig.url).href;
