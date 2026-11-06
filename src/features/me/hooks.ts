// Logic (React Query): cache và đồng bộ dữ liệu server cho UI
import { useMutation, useQuery } from '@tanstack/react-query';
import { meApi } from './api';

export const useSession = () => useQuery({ queryKey: ['session'], queryFn: meApi.session, staleTime: 60_000 });

export const useMe = (enabled: boolean) => useQuery({ queryKey: ['me'], queryFn: meApi.me, enabled, staleTime: 60_000 });

// Quyền hiệu lực tại một resource → dùng để ẩn/hiện nút. Đây chỉ là UX:
// backend luôn kiểm quyền lại, ẩn nút không phải là biện pháp bảo mật.
export function usePermissions(resource: string | undefined) {
  const q = useQuery({
    queryKey: ['permissions', resource],
    queryFn: () => meApi.permissions(resource!),
    enabled: Boolean(resource),
    staleTime: 30_000,
  });
  const set = new Set(q.data?.permissions ?? []);
  return { can: (permission: string) => set.has(permission), isLoading: q.isLoading };
}

export const useLogout = () =>
  useMutation({
    mutationFn: meApi.logout,
    onSuccess: ({ logoutUrl }) => window.location.assign(logoutUrl), // Kết thúc phiên SSO ở Keycloak
  });
