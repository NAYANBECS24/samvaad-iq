import { randomUUID } from 'node:crypto'
import { defineConfig } from '@playwright/test'

const ephemeralApiPassword = `e2e-${randomUUID()}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node functions/api/index.js',
      url: 'http://127.0.0.1:3001/api/v1/health',
      env: { ...process.env, ALLOW_DEMO_AUTH: 'true', DEMO_PASSWORD: ephemeralApiPassword, DEMO_AUTH_SECRET: `e2e-secret-${randomUUID()}` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm --prefix client run dev -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      env: { ...process.env, VITE_OFFLINE_DEMO_PASSWORD: '' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
