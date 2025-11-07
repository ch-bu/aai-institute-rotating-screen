#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"];
const PROGRAM_IMAGE = "program.png";
const MANIFEST_FILENAME = "manifest.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const imagesDir = path.join(repoRoot, "images");
const manifestPath = path.join(imagesDir, MANIFEST_FILENAME);

async function ensureImagesDir() {
  try {
    const stats = await fs.stat(imagesDir);
    if (!stats.isDirectory()) {
      throw new Error(`${imagesDir} exists but is not a directory.`);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Missing images directory at ${imagesDir}`);
    }
    throw error;
  }
}

function isSlideImage(filename) {
  const lower = filename.toLowerCase();
  if (lower === PROGRAM_IMAGE) {
    return false;
  }

  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

async function collectImages() {
  const dirEntries = await fs.readdir(imagesDir, { withFileTypes: true });
  const slides = dirEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(isSlideImage)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  return slides;
}

async function writeManifest(slides) {
  const manifest = { images: slides };
  const contents = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(manifestPath, contents, "utf8");
  return slides.length;
}

async function main() {
  await ensureImagesDir();
  const slides = await collectImages();
  const count = await writeManifest(slides);
  console.log(`Generated ${MANIFEST_FILENAME} with ${count} slide(s).`);
}

main().catch((error) => {
  console.error("Failed to generate manifest:", error.message);
  process.exitCode = 1;
});
