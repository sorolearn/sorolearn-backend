import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      // index.ts only wires env to the server; certificate-client.ts is generated.
      exclude: ["src/**/*.test.ts", "src/index.ts", "src/certificate-client.ts"],
    },
  },
});
