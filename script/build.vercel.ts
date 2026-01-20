/**
 * Vercel Build Script
 *
 * Builds only the client-side application for Vercel deployment.
 * The server runs as serverless functions via api/index.ts
 */

import { build as viteBuild } from "vite";
import { loadConfigFromFile } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildVercel() {
  console.log("Building client for Vercel deployment...");

  try {
    // Load Vercel-specific Vite config
    const configPath = path.resolve(__dirname, "..", "vite.config.vercel.ts");
    const result = await loadConfigFromFile(
      { command: "build", mode: "production" },
      configPath
    );

    if (!result) {
      throw new Error("Failed to load vite.config.vercel.ts");
    }

    // Build client with Vercel config
    await viteBuild({
      ...result.config,
      configFile: false, // Use the loaded config directly
    });

    console.log("✓ Client build complete");
    console.log("→ Output directory: dist/public");
    console.log("→ Server functions: api/");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildVercel();
