import type { Component } from "svelte";
import FacialRecognitionIllustration from "@/components/project-illustrations/FacialRecognitionIllustration.svelte";
import KineGitIllustration from "@/components/project-illustrations/KineGitIllustration.svelte";
import OcbcVtmIllustration from "@/components/project-illustrations/OcbcVtmIllustration.svelte";
import PortfolioIllustration from "@/components/project-illustrations/PortfolioIllustration.svelte";

export const illustrationByKey: Record<string, Component> = {
    portfolioWebsite: PortfolioIllustration,
    kineGit: KineGitIllustration,
    ocbcVTM: OcbcVtmIllustration,
    facialRecognition: FacialRecognitionIllustration,
};

export function resolveIllustration(imageKey: string): Component | undefined {
    return illustrationByKey[imageKey] ?? illustrationByKey[imageKey.toLowerCase()];
}
