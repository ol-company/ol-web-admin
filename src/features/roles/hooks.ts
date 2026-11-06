import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { errorMessage } from '../../shared/api/http';
import { rolesApi } from './api';

export const useRoles = (t: string) => useQuery({ queryKey: ['roles', t], queryFn: () => rolesApi.list(t), enabled: Boolean(t) });
export const usePermissionCatalog = () => useQuery({ queryKey: ['permission-catalog'], queryFn: rolesApi.permissions, staleTime: 300_000 });

export function useRoleMutation<A>(t: string, fn: (a: A) => Promise<unknown>, successText: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['roles', t] });
      notifications.show({ color: 'green', message: successText });
    },
    onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
  });
}
