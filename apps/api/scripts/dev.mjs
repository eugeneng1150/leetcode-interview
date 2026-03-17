import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { context } from "esbuild";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(scriptDir, "..");
const distDir = path.join(apiDir, "dist");
const serverFile = path.join(distDir, "server.js");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

const builder = await context({
  entryPoints: [path.join(apiDir, "src/server.ts")],
  outfile: serverFile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  sourcemap: true
});

await builder.watch();
console.log("Watching API files for changes...");

const serverProcess = spawn(process.execPath, ["--watch", serverFile], {
  stdio: "inherit"
});

const shutdown = async (signal) => {
  serverProcess.kill(signal);
  await builder.dispose();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
