import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One local retry absorbs the dev-hydration race where a click lands
  // between SSR paint and handler attachment under worker contention.
  retries: process.env.CI ? 2 : 1,
  // Local runs share one Next dev server across workers; an unbounded worker
  // count makes on-demand route compilation contend and flake timing asserts.
  workers: process.env.CI ? 1 : 4,
  reporter: 'html',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/math_assist`,
    trace: 'on-first-retry',
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
    command: `npm run dev -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/math_assist`,
    reuseExistingServer: !process.env.CI
  }
})
