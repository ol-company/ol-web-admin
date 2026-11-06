import { api } from '../../shared/api/http';

export interface Role {
  id: string;
  title: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface Permission {
  name: string;
  description: string;
  requiresMfa: boolean;
}

export const rolesApi = {
  list: (t: string) => api.get<Role[]>(`/api/iam/v1/tenants/${t}/roles`),
  permissions: () => api.get<Permission[]>('/api/iam/v1/permissions'),
  create: (t: string, body: { name: string; title: string; description?: string; permissions: string[] }) =>
    api.post<Role>(`/api/iam/v1/tenants/${t}/roles`, body),
  remove: (t: string, name: string) => api.delete<void>(`/api/iam/v1/tenants/${t}/roles/${name}`),
};
