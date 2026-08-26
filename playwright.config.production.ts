import { defineConfig, devices } from '@playwright/test'

// Production static-export lane (T8): serves the built out/ directory with the
// zero-dependency server instead of the Next dev server, single worker, no
// retries. Run `npm run build` first. Usage:
//   npx playwright test --config=playwright.config.production.ts
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4173)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/math_assist`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `node scripts/serve-static-out.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/math_assist`,
    reuseExistingServer: !process.env.CI
  }
})
