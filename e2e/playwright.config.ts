// Playwright chạy E2E trên stack thật: local (docker compose) hoặc dev/staging sau khi deploy (smoke test).
// BASE_URL và mật khẩu người dùng test lấy từ biến môi trường — không ghi trong code.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0, // CI cho thử lại 1 lần để giảm lỗi chập chờn do mạng
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://app.ol.test',
    ignoreHTTPSErrors: process.env.E2E_IGNORE_HTTPS === '1', // Chỉ bật khi chứng chỉ mkcert chưa được tin cậy trong CI
    trace: 'retain-on-failure', // Lưu trace để debug khi test hỏng
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
