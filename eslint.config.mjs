import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const FRAMEWORK = ["next", "next/*", "react", "react-dom", "@supabase/*", "server-only"];
const INFRA = ["@/infrastructure/*", "@/modules/*/infrastructure/*", "@/server/*"];

const restrict = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Domain & core: pure TypeScript, no dependency on other layers or frameworks.
  {
    files: ["src/core/**", "src/modules/*/domain/**"],
    rules: restrict([
      {
        group: [...FRAMEWORK, ...INFRA, "@/modules/*/application/*", "@/app/*", "@/lib/*"],
        message: "Domain/core must not depend on application, infrastructure or frameworks.",
      },
    ]),
  },
  // Application (use case): depends only on domain, core and ports; unaware of frameworks/infrastructure.
  {
    files: ["src/modules/*/application/**"],
    ignores: ["**/*.test.ts"],
    rules: restrict([
      {
        group: [...FRAMEWORK, ...INFRA, "@/app/*", "@/lib/*"],
        message: "Use cases may only depend on domain/core and ports, and must not import frameworks or infrastructure.",
      },
    ]),
  },
  // Presentation (app/): goes through use cases + container, never touches infrastructure directly.
  {
    files: ["src/app/**"],
    rules: restrict([
      {
        group: ["@/infrastructure/*", "@/modules/*/infrastructure/*", "@supabase/*"],
        message: "Routes/pages/actions must call use cases via @/server/container and must not import infrastructure.",
      },
    ]),
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
