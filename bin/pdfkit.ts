#!/usr/bin/env bun

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = resolve(root, "dist");

const args = process.argv.slice(2);
const port = parseInt(args.find((a) => a.startsWith("--port="))?.split("=")[1] ?? "4173");
const noBrowser = args.includes("--no-browser");

// Build if dist doesn't exist
if (!existsSync(resolve(distDir, "index.html"))) {
  console.log("Building PDFKit...");
  const build = Bun.spawnSync(["bun", "run", "build"], { cwd: root, stdio: ["inherit", "inherit", "inherit"] });
  if (build.exitCode !== 0) {
    console.error("Build failed");
    process.exit(1);
  }
}

// Serve the dist folder
const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = resolve(distDir, url.pathname.slice(1));

    // SPA fallback — serve index.html for non-file routes
    if (!existsSync(filePath) || filePath === distDir) {
      filePath = resolve(distDir, "index.html");
    }

    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }
    return new Response("Not found", { status: 404 });
  },
});

const localUrl = `http://localhost:${server.port}`;
console.log(`PDFKit running at ${localUrl}`);

if (!noBrowser) {
  // Open browser
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  Bun.spawn([cmd, localUrl], { stdio: ["ignore", "ignore", "ignore"] });
}
