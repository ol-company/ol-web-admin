import { api } from '../../shared/api/http';
import type { Member } from '../users/api';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

const base = (t: string) => `/api/iam/v1/tenants/${t}/groups`;

export const groupsApi = {
  list: (t: string) => api.get<Group[]>(base(t)),
  create: (t: string, body: { name: string; description?: string }) => api.post<Group>(base(t), body),
  remove: (t: string, id: string) => api.delete<void>(`${base(t)}/${id}`),
  members: (t: string, id: string) => api.get<Member[]>(`${base(t)}/${id}/members`),
  addMember: (t: string, id: string, userId: string) => api.put<void>(`${base(t)}/${id}/members/${userId}`),
  removeMember: (t: string, id: string, userId: string) => api.delete<void>(`${base(t)}/${id}/members/${userId}`),
};
