# ol-web-admin

Frontend quản trị OL-Platform: React + Vite + TanStack Query + Mantine. SPA tĩnh, gọi API qua BFF cùng origin
(cookie phiên HttpOnly, không cầm token).

```text
src/
├── app/            # Khung ứng dụng: provider, router, layout, AuthGate
├── shared/         # Truy cập dữ liệu dùng chung (api/http.ts), runtime config, UI dùng chung
└── features/<x>/   # Theo nghiệp vụ: api.ts (truy cập dữ liệu) · hooks.ts (logic/React Query) · *Page.tsx (UI)
e2e/                # Playwright: smoke + phân quyền, chạy ở local và sau mỗi lần deploy
```

| Lệnh                                         | Ý nghĩa                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm dev`                                   | Vite dev server (chạy trong container sau Caddy: `ol-infra/local/ol.ps1 up -Dev`) |
| `pnpm test` / `pnpm typecheck` / `pnpm lint` | Kiểm tra                                                                          |
| `pnpm build`                                 | Build ra `dist/`                                                                  |
| `pnpm e2e`                                   | E2E (`BASE_URL`, `E2E_PASSWORD`)                                                  |

Cấu hình theo môi trường đọc lúc chạy từ `/config.json` (container sinh từ `APP_ENV`) — không build lại cho từng môi trường.
