import type { APIRoute } from "astro";

const getRobotsTxt = (sitemapUrl: URL) =>
    `User-agent: *
Allow: /

Sitemap: ${sitemapUrl.href}
`;

export const GET: APIRoute = ({ site }) => {
    const sitemapURL = new URL("sitemap-index.xml", site);
    return new Response(getRobotsTxt(sitemapURL));
};
