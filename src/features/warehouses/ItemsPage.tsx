import { Button, Group, NumberInput, Stack, Table, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router';
import { errorMessage } from '../../shared/api/http';
import { QueryState } from '../../shared/ui/QueryState';
import { usePermissions } from '../me/hooks';
import { warehousesApi, type Item } from './api';

export function ItemsPage() {
  const { tenantId = '', warehouseId = '' } = useParams();
  const qc = useQueryClient();
  const warehouse = useQuery({
    queryKey: ['warehouse', tenantId, warehouseId],
    queryFn: () => warehousesApi.get(tenantId, warehouseId),
  });
  const items = useQuery({
    queryKey: ['items', tenantId, warehouseId],
    queryFn: () => warehousesApi.items(tenantId, warehouseId),
  });
  // Quyền có thể được gán riêng cho từng kho → hỏi theo phạm vi kho
  const { can } = usePermissions(`tenants/${tenantId}/warehouses/${warehouseId}`);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const refresh = () => void qc.invalidateQueries({ queryKey: ['items', tenantId, warehouseId] });
  const create = useMutation({
    mutationFn: () => warehousesApi.createItem(tenantId, warehouseId, { sku, name }),
    onSuccess: refresh,
    onError: (e) => notifications.show({ color: 'red', message: errorMessage(e) }),
  });

  return (
    <Stack>
      <Title order={2}>Kho {warehouse.data?.code}</Title>
      {can('warehouse.items.create') && (
        <Group align="end">
          <TextInput label="SKU" value={sku} onChange={(e) => setSku(e.currentTarget.value)} />
          <TextInput
            label="Tên hàng"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Button onClick={() => create.mutate()} loading={create.isPending}>
            Thêm mặt hàng
          </Button>
        </Group>
      )}
      <QueryState isLoading={items.isLoading} error={items.error}>
        <Table data-testid="items-table">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>SKU</Table.Th>
              <Table.Th>Tên</Table.Th>
              <Table.Th>Tồn kho</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.data?.map((i) => (
              <ItemRow
                key={i.id}
                item={i}
                tenantId={tenantId}
                warehouseId={warehouseId}
                canAdjust={can('warehouse.stock.adjust')}
                onChanged={refresh}
              />
            ))}
          </Table.Tbody>
        </Table>
      </QueryState>
    </Stack>
  );
}

function ItemRow(props: {
  item: Item;
  tenantId: string;
  warehouseId: string;
  canAdjust: boolean;
  onChanged: () => void;
}) {
  const [delta, setDelta] = useState<number | string>('');
  const adjust = useMutation({
    mutationFn: () =>
      warehousesApi.adjust(
        props.tenantId,
        props.warehouseId,
        props.item.id,
        { delta: String(delta), reason: 'Điều chỉnh thủ công' },
        crypto.randomUUID(),
      ),
    onSuccess: () => {
      setDelta('');
      props.onChanged();
    },
    onError: (e) => notifications.show({ color: 'red', message: errorMessage(e) }),
  });
  return (
    <Table.Tr>
      <Table.Td>{props.item.sku}</Table.Td>
      <Table.Td>{props.item.name}</Table.Td>
      <Table.Td>
        {props.item.quantity} {props.item.uom}
      </Table.Td>
      <Table.Td>
        {props.canAdjust && (
          <Group gap="xs">
            <NumberInput
              w={110}
              size="xs"
              placeholder="+/- SL"
              decimalScale={3}
              value={delta}
              onChange={setDelta}
            />
            <Button
              size="xs"
              disabled={delta === '' || Number(delta) === 0}
              loading={adjust.isPending}
              onClick={() => adjust.mutate()}
            >
              Lưu
            </Button>
          </Group>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
