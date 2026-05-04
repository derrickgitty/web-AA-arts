import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/helpers/globalSetup.ts"],
    // Integration tests share a server — run sequentially per file to keep auth state predictable.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    // Stop after the first failure to keep output readable
    bail: 0,
  },
});
