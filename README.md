# dominiclim.dev

Personal portfolio site for [Dominic Lim](https://dominiclim.dev).

Built with Astro and Svelte, deployed on Vercel.

## Features

- Single-page layout with Hero, About, Timeline, Certifications, Projects, and Contact sections
- Dark mode with system preference support
- Three.js loading screen with animated logo
- Contact form via EmailJS (client-side or server-validated API route)
- SEO: meta tags, Open Graph, JSON-LD, sitemap, and robots.txt

## Tech stack

- [Astro](https://astro.build) 6
- [Svelte](https://svelte.dev) 5
- [Tailwind CSS](https://tailwindcss.com) 4
- [Three.js](https://threejs.org) + troika-three-text
- [Vercel](https://vercel.com) (hosting, analytics, speed insights)

## Project structure

```text
/
├── public/              # Static assets (logo, OG image)
├── scripts/             # Build scripts (OG image generation)
├── src/
│   ├── components/      # Svelte UI and section components
│   ├── data/            # JSON content (projects, timeline, certifications)
│   ├── layouts/         # BaseLayout.astro
│   ├── lib/             # Shared utilities and site config
│   ├── pages/           # Routes (index, API, robots.txt)
│   └── styles/          # Global CSS
└── astro.config.mjs
```

Content for projects, timeline, and certifications lives in `src/data/*.json`.

## Getting started

Requires Node.js 22.x.

```sh
pnpm install
pnpm dev
```

The dev server runs at [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Action |
| :------ | :----- |
| `pnpm dev` | Start local dev server |
| `pnpm build` | Generate OG image and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm generate:og-image` | Regenerate `public/og-image.png` from the logo |
| `pnpm optimize:images` | Compress and resize source images |

## Environment variables

Copy `.env.example` to `.env` and fill in your EmailJS credentials.

**Client-side** (current contact form setup):

- `PUBLIC_EMAILJS_SERVICE_ID`
- `PUBLIC_EMAILJS_TEMPLATE_ID`
- `PUBLIC_EMAILJS_PUBLIC_KEY`

**Server-side** (optional, for `/api/contact`):

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`

## License

Private — all rights reserved.
