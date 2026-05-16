import { defineConfig, devices } from '@playwright/test';

const PORT = 4200;
const API_PORT = 3000;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 15 Pro'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -w @dutchy/backend',
      cwd: '..',
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'development',
        PORT: String(API_PORT),
        OPENAI_API_KEY: 'sk-test-placeholder',
        CORS_ORIGIN: `http://localhost:${PORT}`,
      },
    },
    {
      command: 'npm run start -w @dutchy/frontend -- --configuration=e2e',
      cwd: '..',
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
