import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, '__tests__/__mocks__/server-only.ts'),
      'isomorphic-dompurify': path.resolve(__dirname, '__tests__/__mocks__/isomorphic-dompurify.ts'),
    },
  },
})
