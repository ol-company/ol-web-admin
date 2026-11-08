import { api } from '../../shared/api/http';

export interface Member {
  id: string;
  email: string;
  displayName: string | null;
  status: 'invited' | 'active' | 'disabled';
  mfaEnrolled: boolean;
  membershipStatus: 'active' | 'disabled';
}

export interface Invitation {
  id: string;
  email: string;
  roleIds: string[];
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt: string;
}

const base = (t: string) => `/api/iam/v1/tenants/${t}`;

export const usersApi = {
  list: (t: string) => api.get<Member[]>(`${base(t)}/users`),
  invitations: (t: string) => api.get<Invitation[]>(`${base(t)}/invitations`),
  invite: (t: string, body: { email: string; roleIds: string[] }) =>
    api.post<Invitation>(`${base(t)}/invitations`, body),
  revoke: (t: string, id: string) => api.delete<void>(`${base(t)}/invitations/${id}`),
  disable: (t: string, userId: string) => api.post<void>(`${base(t)}/users/${userId}/disable`),
  enable: (t: string, userId: string) => api.post<void>(`${base(t)}/users/${userId}/enable`),
  resetPassword: (t: string, userId: string) =>
    api.post<void>(`${base(t)}/users/${userId}/reset-password`),
};
