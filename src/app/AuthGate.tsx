// Chặn toàn bộ ứng dụng cho tới khi có phiên đăng nhập; chưa có → chuyển tới BFF /auth/login
import { Center, Loader } from '@mantine/core';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '../features/me/hooks';

export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const unauthenticated = session.data?.authenticated === false;

  useEffect(() => {
    if (unauthenticated) {
      const returnTo = window.location.pathname + window.location.search;
      window.location.assign(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [unauthenticated]);

  if (session.isLoading || unauthenticated) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }
  return <>{children}</>;
}
