import { socialLinks } from "@/lib/contact";

export const siteConfig = {
    url: "https://dominiclim.dev",
    title: "Dominic Lim — Aspiring Software Engineer",
    shortTitle: "Dominic Lim",
    description:
        "Portfolio of Dominic Lim, an aspiring software engineer passionate about coding, solving complex problems, and building useful projects.",
    locale: "en",
    author: "Dominic Lim",
    jobTitle: "Aspiring Software Engineer",
    ogImage: "/photoOfMe.jpg",
    sameAs: [socialLinks.github, socialLinks.linkedin],
} as const;

export const absoluteUrl = (path: string) => new URL(path, siteConfig.url).href;
