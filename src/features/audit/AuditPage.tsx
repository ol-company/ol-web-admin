// Audit log của tenant, phân trang theo con trỏ (id nhỏ hơn bản ghi cuối)
import { Badge, Button, Code, Stack, Table, Title } from '@mantine/core';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { api } from '../../shared/api/http';
import { QueryState } from '../../shared/ui/QueryState';

interface AuditEvent {
  id: number;
  occurredAt: string;
  actor: string;
  action: string;
  resource: string;
  outcome: 'success' | 'denied' | 'error';
  details: Record<string, unknown>;
}

const PAGE = 50;

export function AuditPage() {
  const { tenantId = '' } = useParams();
  const q = useInfiniteQuery({
    queryKey: ['audit', tenantId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api.get<AuditEvent[]>(`/api/iam/v1/tenants/${tenantId}/audit-events?limit=${PAGE}${pageParam ? `&before=${pageParam}` : ''}`),
    getNextPageParam: (last) => (last.length === PAGE ? last[last.length - 1]!.id : undefined),
  });
  const rows = q.data?.pages.flat() ?? [];

  return (
    <Stack>
      <Title order={2}>Audit log</Title>
      <QueryState isLoading={q.isLoading} error={q.error}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Thời gian</Table.Th>
              <Table.Th>Người thực hiện</Table.Th>
              <Table.Th>Hành động</Table.Th>
              <Table.Th>Tài nguyên</Table.Th>
              <Table.Th>Chi tiết</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((e) => (
              <Table.Tr key={e.id}>
                <Table.Td>{new Date(e.occurredAt).toLocaleString('vi-VN')}</Table.Td>
                <Table.Td>{e.actor}</Table.Td>
                <Table.Td>
                  <Badge color={e.outcome === 'success' ? 'green' : 'red'} variant="light">{e.action}</Badge>
                </Table.Td>
                <Table.Td>{e.resource}</Table.Td>
                <Table.Td><Code>{JSON.stringify(e.details)}</Code></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </QueryState>
      {q.hasNextPage && <Button variant="light" loading={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Tải thêm</Button>}
    </Stack>
  );
}
