import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const entry = (file: string) => fileURLToPath(new URL(file, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Two shells for one SPA: /admin/* is rewritten to admin.html so the
    // installable app it advertises is the panel, not the public site.
    rollupOptions: {
      input: {
        main: entry('index.html'),
        admin: entry('admin.html'),
      },
    },
  },
})
