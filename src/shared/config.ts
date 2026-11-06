// RUNTIME CONFIG: tải /config.json lúc khởi động. Container web sinh file này từ biến môi trường,
// nên đổi môi trường KHÔNG cần build lại image. Không bao giờ đặt bí mật vào đây (trình duyệt đọc được).
import { z } from 'zod';

const RuntimeConfigSchema = z.object({
  environment: z.enum(['local', 'dev', 'staging', 'prod']),
  appName: z.string().default('OL-Platform Admin'),
});

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const res = await fetch('/config.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Không tải được /config.json (HTTP ${res.status})`);
  return RuntimeConfigSchema.parse(await res.json());
}

// BUILD-TIME CONFIG (tùy chọn): biến VITE_* được nhúng vào bundle khi build — đổi thì phải build lại.
// Dùng cho thông tin gắn với bản build, ví dụ mã phiên bản.
export const BUILD_VERSION: string = import.meta.env.VITE_BUILD_VERSION ?? 'dev';
