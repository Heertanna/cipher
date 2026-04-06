import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so JS/CSS work for any GitHub Pages URL:
// https://<user>.github.io/<repo>/  (repo name can change; no hardcoded /cipher/)
// See https://vite.dev/config/shared-options.html#base
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : './',
  plugins: [react()],
}))
