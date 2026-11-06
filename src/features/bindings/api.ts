import { api } from '../../shared/api/http';

export interface RoleBinding {
  id: string;
  principalType: 'user' | 'group' | 'service';
  principalId: string;
  roleId: string;
  resource: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
}

const base = (t: string) => `/api/iam/v1/tenants/${t}/role-bindings`;

export const bindingsApi = {
  list: (t: string) => api.get<RoleBinding[]>(base(t)),
  create: (t: string, body: { principalType: 'user' | 'group'; principalId: string; roleId: string; resource: string }) =>
    api.post<RoleBinding>(base(t), body),
  remove: (t: string, id: string) => api.delete<void>(`${base(t)}/${id}`),
};
