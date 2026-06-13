import { renameSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** @type {{ path: string; maxWidth: number; quality?: number; webp?: boolean }[]} */
const targets = [
    { path: "src/assets/pictures/work/ocbc.png", maxWidth: 512, quality: 80 },
    { path: "src/assets/pictures/education/northlandss.png", maxWidth: 512, quality: 80 },
    { path: "src/assets/pictures/education/republicpoly.png", maxWidth: 512, quality: 80 },
    { path: "src/assets/pictures/certification/hackerRank.png", maxWidth: 256, quality: 80 },
    { path: "src/assets/pictures/certification/openedg.png", maxWidth: 256, quality: 80 },
    { path: "src/assets/pictures/certification/harvardx.jpeg", maxWidth: 256, quality: 80 },
    { path: "public/photoOfMe.jpg", maxWidth: 768, quality: 82, webp: true },
];

const writeOptimized = async (inputPath, { maxWidth, quality, webp }) => {
    const absolutePath = join(root, inputPath);
    const tempPath = `${absolutePath}.tmp`;
    const image = sharp(absolutePath);
    const metadata = await image.metadata();
    let pipeline = image.rotate();

    if ((metadata.width ?? 0) > maxWidth) {
        pipeline = pipeline.resize(maxWidth, maxWidth, {
            fit: "inside",
            withoutEnlargement: true,
        });
    }

    if (inputPath.endsWith(".png")) {
        await pipeline
            .png({ quality, compressionLevel: 9, palette: true, effort: 10 })
            .toFile(tempPath);
    } else {
        await pipeline.jpeg({ quality, mozjpeg: true }).toFile(tempPath);
    }

    renameSync(tempPath, absolutePath);

    if (webp) {
        const webpPath = absolutePath.replace(/\.(jpe?g|png)$/i, ".webp");
        await sharp(absolutePath)
            .webp({ quality })
            .toFile(`${webpPath}.tmp`);
        renameSync(`${webpPath}.tmp`, webpPath);
        console.log(`  + ${webpPath.replace(root + "/", "")}`);
    }

    const after = await sharp(absolutePath).metadata();
    console.log(`  ${inputPath} -> ${after.width}x${after.height}`);
};

for (const target of targets) {
    console.log(`Optimizing ${target.path}`);
    await writeOptimized(target.path, target);
}

console.log("Image optimization complete.");
