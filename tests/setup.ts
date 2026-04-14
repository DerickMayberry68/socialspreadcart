// Vitest global setup: load .env.test before any test file runs.
// Referenced from vitest.config.ts -> setupFiles.
import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env.test explicitly so this file can be used in CI without clobbering
// the developer's regular .env.local.
config({ path: resolve(process.cwd(), ".env.test"), override: true });
