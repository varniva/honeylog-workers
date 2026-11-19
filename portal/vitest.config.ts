import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest configuration for focused unit tests.
 *
 * Tests avoid the Next.js runtime — authorization helpers accept injected
 * `authFn`/`db` dependencies, so everything below runs without a database.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
