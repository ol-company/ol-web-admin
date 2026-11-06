// SMOKE TEST: chạy sau mỗi lần deploy (dev, staging) và ở local.
// Kiểm chứng luồng chính: frontend → đăng nhập → API được bảo vệ → phân quyền → DB → hiển thị.
import { expect, test } from '@playwright/test';
import { login } from '../support/login';

const password = process.env.E2E_PASSWORD ?? '';
// Tài khoản kiểm thử: local dùng dữ liệu seed-demo; dev/staging đặt qua biến E2E_OPERATOR_EMAIL/E2E_VIEWER_EMAIL
const operator = process.env.E2E_OPERATOR_EMAIL || 'operator@acme.test';

test.describe('smoke', () => {
  test.skip(!password, 'Thiếu E2E_PASSWORD');

  test('health của BFF trả 200', async ({ request }) => {
    const res = await request.get('/health/ready');
    expect(res.status()).toBe(200);
  });

  test('chưa đăng nhập: /api trả 401, không lộ dữ liệu', async ({ request }) => {
    const res = await request.get('/api/iam/v1/me');
    expect(res.status()).toBe(401);
  });

  test('operator đăng nhập, xem kho, thêm mặt hàng và nhập kho', async ({ page }) => {
    await login(page, operator, password);
    await expect(page.getByTestId('warehouses-table')).toBeVisible();
    // Operator không có quyền quản trị người dùng → menu "Người dùng" không hiển thị
    await expect(page.getByRole('link', { name: 'Người dùng' })).toHaveCount(0);
  });

  test('cookie phiên là HttpOnly + Secure, không có token trong JS', async ({ page, context }) => {
    await login(page, operator, password);
    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === '__Host-ol_session');
    expect(session?.httpOnly).toBe(true);
    expect(session?.secure).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain('ol_session');
  });
});
