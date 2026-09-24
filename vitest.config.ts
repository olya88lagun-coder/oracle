import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // "apps/*" добавляется в задаче 3 вместе с первым приложением
    projects: ["packages/*"],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**/*.ts", "packages/db/src/**/*.ts", "apps/web/src/server/**/*.ts", "apps/web/src/lib/**/*.{ts,tsx}"],
      exclude: ["**/*.test.ts", "**/index.ts", "**/testing.ts", "**/client.ts"],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});
