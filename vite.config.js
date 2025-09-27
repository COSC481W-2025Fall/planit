// vitest.config.js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,       // use describe/test without importing
    environment: "node", // important for backend
  },
});
