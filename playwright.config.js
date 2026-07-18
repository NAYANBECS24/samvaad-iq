import { randomUUID } from 'node:crypto'
import { defineConfig } from '@playwright/test'

const ephemeralApiPassword = `e2e-${randomUUID()}`
const apiPort = Number(process.env.PLAYWRIGHT_API_PORT || 31841)
const webPort = Number(process.env.PLAYWRIGHT_WEB_PORT || 31842)
const apiOrigin = `http://127.0.0.1:${apiPort}`
const webOrigin = `http://127.0.0.1:${webPort}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: webOrigin,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node functions/api/index.js',
      url: `${apiOrigin}/api/v1/health`,
      env: { ...process.env, PORT: String(apiPort), ALLOW_DEMO_AUTH: 'true', DEMO_PASSWORD: ephemeralApiPassword, DEMO_AUTH_SECRET: `e2e-secret-${randomUUID()}` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm --prefix client run dev -- --host 127.0.0.1 --port ${webPort}`,
      url: webOrigin,
      env: { ...process.env, VITE_OFFLINE_DEMO_PASSWORD: '', VITE_DEV_API_TARGET: apiOrigin },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
