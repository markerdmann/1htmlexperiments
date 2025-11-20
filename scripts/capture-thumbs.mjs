import { chromium } from "playwright-chromium";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(repoRoot, "manifest.json");
const thumbsDir = path.join(repoRoot, "thumbs");
const port = 4173;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const startServer = () =>
  new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const reqPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
        const normalized = reqPath === "/" ? "/index.html" : reqPath;
        const filePath = path.join(repoRoot, normalized.replace(/^\//, ""));
        const stat = await fs.stat(filePath).catch(() => null);
        if (!stat || stat.isDirectory()) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const type = mime[ext] || "application/octet-stream";
        res.setHeader("Content-Type", type);
        res.end(await fs.readFile(filePath));
      } catch (error) {
        res.statusCode = 500;
        res.end(error.message);
      }
    });
    server.listen(port, () => resolve(server));
  });

const main = async () => {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 } });
  const page = await context.newPage();

  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  await fs.mkdir(thumbsDir, { recursive: true });

  for (const entry of manifest) {
    const url = `http://localhost:${port}/${entry.path}`;
    const out = path.join(thumbsDir, `${entry.slug}.png`);
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`Captured ${entry.slug} -> ${path.relative(repoRoot, out)}`);
    } catch (error) {
      console.error(`Failed to capture ${entry.slug}:`, error.message);
    }
  }

  await browser.close();
  server.close();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
