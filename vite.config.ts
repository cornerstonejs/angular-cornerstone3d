/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';

import viteTsConfigPaths from 'vite-tsconfig-paths';
import angular from '@analogjs/vite-plugin-angular';
import {viteCommonjs} from '@originjs/vite-plugin-commonjs';


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    root: __dirname,
    cacheDir: './node_modules/.vite',
    build: {
      outDir: './dist/./client',
      reportCompressedSize: true,
      target: ['es2020'],
    },
    plugins: [
      analog({
        ssr: false,
        static: true,
        prerender: {
          routes: []
        }
      }),angular(),
      viteCommonjs(),
      viteTsConfigPaths(),

    ],
    worker: {
      format: "es",
    },
    optimizeDeps: {
      exclude: ["@cornerstonejs/dicom-image-loader"],
      include: ["dicom-parser"],
    },
    server: {
      fs: {
        allow: ['.']
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
    },
    define: {
      'import.meta.vitest': mode !== 'production',
    },
  };
});
