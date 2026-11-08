import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { errorMessage } from '../../shared/api/http';
import { usersApi } from './api';

export const useMembers = (t: string) =>
  useQuery({ queryKey: ['members', t], queryFn: () => usersApi.list(t) });
export const useInvitations = (t: string) =>
  useQuery({ queryKey: ['invitations', t], queryFn: () => usersApi.invitations(t) });

// Mọi thao tác ghi: thành công → làm mới danh sách liên quan; lỗi → thông báo thân thiện
export function useUserAction<A>(
  t: string,
  fn: (args: A) => Promise<unknown>,
  successText: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['members', t] });
      void qc.invalidateQueries({ queryKey: ['invitations', t] });
      void qc.invalidateQueries({ queryKey: ['bindings', t] });
      notifications.show({ color: 'green', message: successText });
    },
    onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
  });
}
