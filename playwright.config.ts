import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 8000',
    cwd: 'web-app',
    port: 8000,
    reuseExistingServer: true,
    timeout: 30_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
});
