import { Anchor, Button, Group, Stack, Table, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { errorMessage } from '../../shared/api/http';
import { QueryState } from '../../shared/ui/QueryState';
import { usePermissions } from '../me/hooks';
import { warehousesApi } from './api';

export function WarehousesPage() {
  const { tenantId = '' } = useParams();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['warehouses', tenantId], queryFn: () => warehousesApi.list(tenantId) });
  const { can } = usePermissions(`tenants/${tenantId}`);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const create = useMutation({
    mutationFn: () => warehousesApi.create(tenantId, { code, name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['warehouses', tenantId] });
      setCode('');
      setName('');
    },
    onError: (e) => notifications.show({ color: 'red', message: errorMessage(e) }),
  });

  return (
    <Stack>
      <Title order={2}>Kho</Title>
      {can('warehouse.warehouses.create') && (
        <Group align="end">
          <TextInput label="Mã kho" placeholder="HCM-01" value={code} onChange={(e) => setCode(e.currentTarget.value.toUpperCase())} />
          <TextInput label="Tên kho" value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <Button loading={create.isPending} onClick={() => create.mutate()}>Tạo kho</Button>
        </Group>
      )}
      <QueryState isLoading={list.isLoading} error={list.error}>
        <Table data-testid="warehouses-table">
          <Table.Tbody>
            {list.data?.map((w) => (
              <Table.Tr key={w.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/t/${tenantId}/warehouses/${w.id}`}>{w.code}</Anchor>
                </Table.Td>
                <Table.Td>{w.name}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </QueryState>
    </Stack>
  );
}
