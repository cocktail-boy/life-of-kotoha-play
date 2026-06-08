import { defineConfig } from "vite";

// Relative base so the build works under any GitHub Pages path
// (https://<user>.github.io/life-of-kotoha-play/) or a custom domain.
export default defineConfig({
  base: "./",
});
