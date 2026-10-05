import { defineConfig } from '@playwright/test'

export default defineConfig({
  timeout: 30000,
  workers: 1,
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
  },
  // M-C3: auto-start dev server so `npm test` works on fresh checkout
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
