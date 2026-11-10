import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  // Packages that only load on a lazy path (the PDF viewer, the crop dialog) are not seen when
  // the dev server starts. Vite then bundles them on first use, which invalidates the others and
  // makes that first lazy import fail once ("504 Outdated Optimize Dep"). Listing them here
  // bundles them up front, so a fresh `npm run dev` works the first time.
  optimizeDeps: {
    include: [
      'react-pdf',
      'pdfjs-dist',
      'react-easy-crop',
      'react-markdown',
      'remark-breaks',
      'dompurify',
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/tests/**/*.test.{js,jsx}'],
    css: false,
  },
});
