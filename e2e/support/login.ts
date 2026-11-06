// Đăng nhập qua trang Keycloak thật. Nếu Keycloak yêu cầu thiết lập/nhập TOTP, tự tính mã bằng secret.
// [CHƯA XÁC MINH] selector của theme đăng nhập Keycloak 26 (#username, #password, #kc-login, #totp, #otp,
// link "mode-manual", phần tử "kc-totp-secret-key") — kiểm lại khi chạy lần đầu, cập nhật nếu theme khác.
import type { Page } from '@playwright/test';
import { Secret, TOTP } from 'otpauth';

const totpSecrets = new Map<string, string>(); // Ghi nhớ secret đã thiết lập trong phiên test

function code(secret: string): string {
  return new TOTP({ secret: Secret.fromBase32(secret.replace(/\s+/g, '')), digits: 6, period: 30, algorithm: 'SHA1' }).generate();
}

export async function login(page: Page, email: string, password: string, returnTo = '/'): Promise<void> {
  await page.goto(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  await page.locator('#username').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#kc-login').click();

  // Trường hợp 1: lần đầu, Keycloak yêu cầu thiết lập TOTP (required action CONFIGURE_TOTP)
  if (await page.locator('#totp').isVisible().catch(() => false)) {
    await page.locator('#mode-manual').click(); // "Không quét được?" → hiện secret dạng chữ
    const secret = (await page.locator('#kc-totp-secret-key').innerText()).trim();
    totpSecrets.set(email, secret);
    await page.locator('#totp').fill(code(secret));
    await page.locator('#userLabel').fill('e2e').catch(() => undefined);
    await page.locator('[type=submit]').first().click();
  }
  // Trường hợp 2: đã thiết lập, Keycloak hỏi mã OTP
  else if (await page.locator('#otp').isVisible().catch(() => false)) {
    const secret = totpSecrets.get(email) ?? process.env[`E2E_TOTP_${email.split('@')[0]!.toUpperCase()}`];
    if (!secret) throw new Error(`Thiếu TOTP secret cho ${email}`);
    await page.locator('#otp').fill(code(secret));
    await page.locator('#kc-login').click();
  }
  await page.waitForURL((url) => !url.hostname.startsWith('id.'), { timeout: 30_000 }); // Đã quay về app
}
