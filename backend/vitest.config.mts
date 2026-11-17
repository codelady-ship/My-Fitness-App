import { defineConfig } from "vitest/config";

export default defineConfig({
  // Inline config stops Vite from loading the Next.js app PostCSS config one folder up.
  css: { postcss: {} },
  test: {
    environment: "node",
    globalSetup: ["./tests/globalSetup.ts"],
    setupFiles: ["./tests/setup.ts"],
    // Files run one at a time (low-RAM friendly), each in a fresh process, sharing one in-memory MongoDB.
    pool: "forks",
    poolOptions: { forks: { maxForks: 1, minForks: 1 } },
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
