import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const experimentsDir = path.join(repoRoot, "experiments");
const manifestPath = path.join(repoRoot, "manifest.json");

const palette = ["#7bd7ff", "#ffa8e7", "#c6ff7b", "#ffd166", "#b2a1ff", "#6ef7c8"];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "experiment";

const pickAccent = (key) => {
  let hash = 0;
  for (const char of key) {
    hash = (hash + char.charCodeAt(0) * 13) % 997;
  }
  return palette[hash % palette.length];
};

const readMeta = async (filePath) => {
  const content = await fs.readFile(filePath, "utf8");
  const metaMatch = content.match(/<!--\s*meta\s*({[\s\S]*?})\s*-->/i);
  if (!metaMatch) return {};
  try {
    return JSON.parse(metaMatch[1]);
  } catch (error) {
    throw new Error(`Invalid JSON in meta block for ${path.basename(filePath)}: ${error.message}`);
  }
};

const collect = async () => {
  await fs.mkdir(experimentsDir, { recursive: true });
  const files = await fs.readdir(experimentsDir);
  const htmlFiles = files.filter((file) => file.toLowerCase().endsWith(".html"));

  const entries = [];
  for (const file of htmlFiles) {
    const fullPath = path.join(experimentsDir, file);
    const meta = await readMeta(fullPath);
    const stats = await fs.stat(fullPath);
    const base = path.basename(file, path.extname(file));
    const slug = meta.slug ? slugify(meta.slug) : slugify(base);
    entries.push({
      slug,
      title: meta.title || base.replace(/[-_]/g, " ") || "Untitled",
      description: meta.description || "",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      path: `experiments/${file}`,
      thumbnail: meta.thumbnail || "",
      accent: meta.accent || pickAccent(slug),
      date: meta.date || stats.mtime.toISOString().slice(0, 10),
    });
  }

  entries.sort((a, b) => (a.date < b.date ? 1 : -1));
  return entries;
};

const main = async () => {
  const manifest = await collect();
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${manifest.length} entries to manifest.json`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
