// E2E phân quyền: thiếu quyền và truy cập chéo tenant phải bị từ chối ở backend (không chỉ ẩn nút).
import { expect, test } from '@playwright/test';
import { login } from '../support/login';

const password = process.env.E2E_PASSWORD ?? '';
// Tài khoản kiểm thử: local dùng dữ liệu seed-demo; dev/staging đặt qua biến E2E_OPERATOR_EMAIL/E2E_VIEWER_EMAIL
const operator = process.env.E2E_OPERATOR_EMAIL || 'operator@acme.test';
const viewer = process.env.E2E_VIEWER_EMAIL || 'viewer@globex.test';

test.describe('authorization', () => {
  test.skip(!password, 'Thiếu E2E_PASSWORD');

  test('viewer Globex gọi API của ACME → 403', async ({ page }) => {
    await login(page, operator, password);
    const me = await page.request.get('/api/iam/v1/me');
    const acmeId = (await me.json()).tenants[0].id as string;
    await page.context().clearCookies();

    await login(page, viewer, password);
    const res = await page.request.get(`/api/warehouse/v1/tenants/${acmeId}/warehouses`);
    expect(res.status()).toBe(403);
    expect((await res.json()).details.reason).toBe('not-member');
  });

  test('operator không gọi được API quản trị dù gửi trực tiếp', async ({ page }) => {
    await login(page, operator, password);
    const tenantId = (await (await page.request.get('/api/iam/v1/me')).json()).tenants[0].id as string;
    const res = await page.request.post(`/api/iam/v1/tenants/${tenantId}/invitations`, {
      headers: { 'x-ol-csrf': '1' },
      data: { email: 'x@acme.test', roleIds: ['roles/iam.tenantAdmin'] },
    });
    expect(res.status()).toBe(403);
  });

  test('POST không có header CSRF bị chặn', async ({ page }) => {
    await login(page, operator, password);
    const res = await page.request.post('/api/iam/v1/tenants', { data: {} });
    expect(res.status()).toBe(403);
  });

  // Chỉ chạy trên stack mới seed (local/CI): lần đầu admin phải thiết lập TOTP
  test('tenant admin phải thiết lập MFA rồi mới quản trị được', async ({ page }) => {
    test.skip(process.env.E2E_FRESH_STACK !== '1', 'Cần stack vừa seed (E2E_FRESH_STACK=1)');
    await login(page, 'admin@acme.test', password); // login() tự xử lý màn hình thiết lập TOTP
    const tenantId = (await (await page.request.get('/api/iam/v1/me')).json()).tenants[0].id as string;
    await page.goto(`/t/${tenantId}/users`);
    await expect(page.getByTestId('members-table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mời người dùng' })).toBeVisible();
  });
});
