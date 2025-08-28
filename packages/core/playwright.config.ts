import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './benchmarks',
  fullyParallel: false, // Run benchmarks sequentially for consistent results
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker for consistent benchmarking
  reporter: 'list',
  timeout: 120000, // 2 minute timeout for benchmarks
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Optionally test in other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  webServer: {
    command: 'npm run serve:benchmark',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
