import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, context } from "esbuild";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const extensionDir = path.resolve(scriptDir, "..");
const distDir = path.join(extensionDir, "dist");
const publicDir = path.join(extensionDir, "public");
const watchMode = process.argv.includes("--watch");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

const buildOptions = {
  entryPoints: {
    "background/index": path.join(extensionDir, "src/background/index.ts"),
    "content/index": path.join(extensionDir, "src/content/index.ts")
  },
  outdir: distDir,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "chrome114",
  sourcemap: true
};

if (watchMode) {
  const builder = await context(buildOptions);
  await builder.watch();
  console.log("Watching extension files for changes...");
} else {
  await build(buildOptions);
}
