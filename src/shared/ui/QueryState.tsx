// Hiển thị trạng thái tải/lỗi thống nhất cho mọi trang
import { Alert, Loader } from '@mantine/core';
import type { ReactNode } from 'react';
import { errorMessage } from '../api/http';

export function QueryState(props: { isLoading: boolean; error: unknown; children: ReactNode }) {
  if (props.isLoading) return <Loader size="sm" />;
  if (props.error)
    return (
      <Alert color="red" title="Không tải được dữ liệu">
        {errorMessage(props.error)}
      </Alert>
    );
  return <>{props.children}</>;
}
