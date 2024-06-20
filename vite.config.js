import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@cornerstonejs/dicom-image-loader"],
  },
  worker: {
    format: "es",
  },
});
