import { api } from '../../shared/api/http';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  uom: string;
  quantity: string;
  updatedAt: string;
}

const base = (t: string) => `/api/warehouse/v1/tenants/${t}/warehouses`;

export const warehousesApi = {
  list: (t: string) => api.get<Warehouse[]>(base(t)),
  create: (t: string, body: { code: string; name: string; address?: string }) =>
    api.post<Warehouse>(base(t), body),
  get: (t: string, w: string) => api.get<Warehouse>(`${base(t)}/${w}`),
  items: (t: string, w: string) => api.get<Item[]>(`${base(t)}/${w}/items`),
  createItem: (t: string, w: string, body: { sku: string; name: string; uom?: string }) =>
    api.post<Item>(`${base(t)}/${w}/items`, body),
  // Idempotency-Key sinh 1 lần cho mỗi thao tác người dùng → bấm 2 lần hay mạng chập chờn cũng không cộng trùng
  adjust: (
    t: string,
    w: string,
    itemId: string,
    body: { delta: string; reason: string },
    key: string,
  ) =>
    api.post<{ item: Item }>(`${base(t)}/${w}/items/${itemId}/adjustments`, body, {
      headers: { 'idempotency-key': key },
    }),
};
