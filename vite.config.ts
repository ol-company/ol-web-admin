// Cấu hình Vite: build SPA tĩnh vào dist/. Không có biến bí mật nào trong bundle.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true, // Source map phục vụ debug; nginx không cache, không lộ bí mật vì bundle không có bí mật
    assetsInlineLimit: 0, // Không nhúng asset dạng data: → giữ CSP chặt (img-src 'self')
  },
  server: {
    // Chạy dev trong container sau Caddy: file trên ổ Windows (/mnt/d) không phát sự kiện inotify → dùng polling
    watch: process.env.VITE_POLL === '1' ? { usePolling: true, interval: 500 } : undefined,
    hmr: process.env.VITE_HMR_HOST ? { host: process.env.VITE_HMR_HOST, protocol: 'wss', clientPort: 443 } : undefined,
    allowedHosts: ['app.ol.test'],
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
