import projectsData from "@/data/projects.json";

export type DemoType = "live" | "video";

export interface Project {
    title: string;
    description: string;
    technologies: string[];
    github: string;
    demo: string;
    demoType: DemoType;
    image: string;
}

export const projects = projectsData as Project[];
