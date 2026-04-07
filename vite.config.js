import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Must match the GitHub repo name (project Pages URL is /{repo}/).
// Do NOT use base: './' — relative asset URLs break on client routes (e.g.
// /cipher/foo resolves ./assets to /cipher/foo/assets → 404).
const pagesBase = '/cipher/'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : pagesBase,
  plugins: [react()],
}))
