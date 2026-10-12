import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text"],
      // Only measure logic that can be tested in isolation; UI and Next glue code are covered by `manual` ACs / the build.
      include: [
        "src/core/**",
        "src/modules/**",
        "src/lib/http.ts",
        "src/lib/action-error.ts",
        "src/lib/safe-redirect.ts",
        "src/lib/site-url.ts",
        "src/lib/landing-cta.ts",
        "src/lib/profile-display.ts",
        "src/i18n/locale-path.ts",
        "src/app/auth/callback/route.ts",
        "src/infrastructure/supabase/proxy.ts",
      ],
      exclude: ["**/*.test.ts", "src/test/**"],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
