// Truy cập dữ liệu: phiên đăng nhập (BFF) và hồ sơ người dùng (IAM)
import { api } from '../../shared/api/http';

export interface SessionInfo {
  authenticated: boolean;
  user?: { id: string; email: string | null; name: string | null };
}

export interface Me {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    status: string;
    mfaEnrolled: boolean;
  };
  tenants: Array<{ id: string; slug: string; name: string }>;
  platform: { permissions: string[] };
}

export const meApi = {
  session: () => api.get<SessionInfo>('/auth/session'),
  me: () => api.get<Me>('/api/iam/v1/me'),
  permissions: (resource: string) =>
    api.get<{ resource: string; permissions: string[] }>(
      `/api/iam/v1/me/permissions?resource=${encodeURIComponent(resource)}`,
    ),
  logout: () => api.post<{ logoutUrl: string }>('/auth/logout'),
};
