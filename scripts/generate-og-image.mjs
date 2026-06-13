import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logoSvg = readFileSync(join(root, "public/domLogo.svg"), "utf8");
const logoInner = logoSvg.replace(/<\?xml[^?]*\?>\s*/i, "").replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const width = 1200;
const height = 630;
const logoSize = 320;
const logoX = (width - logoSize) / 2;
const logoY = (height - logoSize) / 2 - 36;

const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#fafafa"/>
  <g transform="translate(${logoX} ${logoY}) scale(${logoSize / 200})">
    ${logoInner}
  </g>
  <text
    x="${width / 2}"
    y="${logoY + logoSize + 52}"
    text-anchor="middle"
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="28"
    font-weight="500"
    fill="#0a0a0a"
  >dominiclim.dev</text>
</svg>`;

const outputPath = join(root, "public/og-image.png");

await sharp(Buffer.from(ogSvg))
    .resize(width, height)
    .png()
    .toFile(outputPath);

writeFileSync(join(root, "public/og-image.svg"), ogSvg);
console.log(`Generated ${outputPath} (${width}x${height})`);
