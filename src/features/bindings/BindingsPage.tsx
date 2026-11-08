// Gán quyền = chủ thể (người dùng/nhóm) + role + phạm vi (tenant hoặc một kho cụ thể)
import { Button, Group, SegmentedControl, Select, Stack, Table, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router';
import { errorMessage } from '../../shared/api/http';
import { QueryState } from '../../shared/ui/QueryState';
import { groupsApi } from '../groups/api';
import { usePermissions } from '../me/hooks';
import { useRoles } from '../roles/hooks';
import { useMembers } from '../users/hooks';
import { warehousesApi } from '../warehouses/api';
import { bindingsApi } from './api';

export function BindingsPage() {
  const { tenantId = '' } = useParams();
  const qc = useQueryClient();
  const bindings = useQuery({
    queryKey: ['bindings', tenantId],
    queryFn: () => bindingsApi.list(tenantId),
  });
  const members = useMembers(tenantId);
  const groups = useQuery({
    queryKey: ['groups', tenantId],
    queryFn: () => groupsApi.list(tenantId),
  });
  const roles = useRoles(tenantId);
  const warehouses = useQuery({
    queryKey: ['warehouses', tenantId],
    queryFn: () => warehousesApi.list(tenantId),
    retry: false,
  });
  const { can } = usePermissions(`tenants/${tenantId}`);

  const [principalType, setPrincipalType] = useState<'user' | 'group'>('user');
  const [principalId, setPrincipalId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [resource, setResource] = useState<string>(`tenants/${tenantId}`);

  const done = {
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bindings', tenantId] });
      void qc.invalidateQueries({ queryKey: ['permissions'] });
      notifications.show({ color: 'green', message: 'Đã cập nhật quyền' });
    },
    onError: (e: unknown) => notifications.show({ color: 'red', message: errorMessage(e) }),
  };
  const create = useMutation({
    mutationFn: () =>
      bindingsApi.create(tenantId, {
        principalType,
        principalId: principalId!,
        roleId: roleId!,
        resource,
      }),
    ...done,
  });
  const remove = useMutation({
    mutationFn: (id: string) => bindingsApi.remove(tenantId, id),
    ...done,
  });

  const nameOf = (type: string, id: string) =>
    type === 'user'
      ? (members.data?.find((m) => m.id === id)?.email ?? id)
      : (groups.data?.find((g) => g.id === id)?.name ?? id);
  const scopeOptions = [
    { value: `tenants/${tenantId}`, label: 'Toàn tenant' },
    ...(warehouses.data ?? []).map((w) => ({
      value: `tenants/${tenantId}/warehouses/${w.id}`,
      label: `Kho ${w.code}`,
    })),
  ];

  return (
    <Stack>
      <Title order={2}>Gán quyền</Title>
      {can('iam.roleBindings.create') && (
        <Group align="end">
          <SegmentedControl
            value={principalType}
            onChange={(v) => {
              setPrincipalType(v as 'user' | 'group');
              setPrincipalId(null);
            }}
            data={[
              { value: 'user', label: 'Người dùng' },
              { value: 'group', label: 'Nhóm' },
            ]}
          />
          <Select
            label="Chủ thể"
            searchable
            value={principalId}
            onChange={setPrincipalId}
            data={
              principalType === 'user'
                ? (members.data ?? []).map((m) => ({ value: m.id, label: m.email }))
                : (groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))
            }
          />
          <Select
            label="Role"
            value={roleId}
            onChange={setRoleId}
            data={(roles.data ?? []).map((r) => ({ value: r.id, label: r.title }))}
          />
          <Select
            label="Phạm vi"
            value={resource}
            onChange={(v) => setResource(v ?? `tenants/${tenantId}`)}
            data={scopeOptions}
          />
          <Button
            disabled={!principalId || !roleId}
            loading={create.isPending}
            onClick={() => create.mutate()}
          >
            Gán
          </Button>
        </Group>
      )}
      <QueryState isLoading={bindings.isLoading} error={bindings.error}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Chủ thể</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Phạm vi</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {bindings.data?.map((b) => (
              <Table.Tr key={b.id}>
                <Table.Td>
                  {b.principalType === 'group' ? '👥 ' : ''}
                  {nameOf(b.principalType, b.principalId)}
                </Table.Td>
                <Table.Td>{b.roleId}</Table.Td>
                <Table.Td>
                  <Text size="xs">{b.resource}</Text>
                </Table.Td>
                <Table.Td>
                  {can('iam.roleBindings.delete') && (
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => remove.mutate(b.id)}
                    >
                      Thu hồi
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </QueryState>
    </Stack>
  );
}
