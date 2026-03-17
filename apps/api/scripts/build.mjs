import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(scriptDir, "..");
const distDir = path.join(apiDir, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await build({
  entryPoints: [path.join(apiDir, "src/server.ts")],
  outfile: path.join(distDir, "server.js"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  sourcemap: true
});
