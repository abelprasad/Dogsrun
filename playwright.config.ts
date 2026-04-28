import { defineConfig } from '@playwright/test'

export default defineConfig({
  timeout: 30000,
  workers: 1,
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
  },
})
