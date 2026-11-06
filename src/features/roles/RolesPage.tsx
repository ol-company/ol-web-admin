import { Badge, Button, Group, Modal, MultiSelect, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { useParams } from 'react-router';
import { usePermissions } from '../me/hooks';
import { QueryState } from '../../shared/ui/QueryState';
import { rolesApi } from './api';
import { usePermissionCatalog, useRoleMutation, useRoles } from './hooks';

export function RolesPage() {
  const { tenantId = '' } = useParams();
  const roles = useRoles(tenantId);
  const { can } = usePermissions(`tenants/${tenantId}`);
  const [opened, { open, close }] = useDisclosure(false);
  const remove = useRoleMutation(tenantId, (name: string) => rolesApi.remove(tenantId, name), 'Đã xóa role');

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Role</Title>
        {can('iam.roles.create') && <Button onClick={open}>Tạo role tùy chỉnh</Button>}
      </Group>
      <QueryState isLoading={roles.isLoading} error={roles.error}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Role</Table.Th>
              <Table.Th>Permission</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {roles.data?.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Text fw={500}>{r.title}</Text>
                  <Text size="xs" c="dimmed">{r.id}</Text>
                  {r.isSystem && <Badge size="xs">hệ thống</Badge>}
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{r.permissions.join(', ')}</Text>
                </Table.Td>
                <Table.Td>
                  {!r.isSystem && can('iam.roles.delete') && (
                    <Button size="xs" color="red" variant="subtle" onClick={() => remove.mutate(r.id.split('/').pop()!)}>Xóa</Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </QueryState>
      <Modal opened={opened} onClose={close} title="Tạo role tùy chỉnh">
        <CreateRoleForm tenantId={tenantId} onDone={close} />
      </Modal>
    </Stack>
  );
}

function CreateRoleForm({ tenantId, onDone }: { tenantId: string; onDone: () => void }) {
  const catalog = usePermissionCatalog();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const create = useRoleMutation(tenantId, () => rolesApi.create(tenantId, { name, title, permissions }), 'Đã tạo role');
  return (
    <Stack>
      <TextInput label="Tên (định danh)" description="Chữ và số, ví dụ stockAuditor" value={name} onChange={(e) => setName(e.currentTarget.value)} />
      <TextInput label="Tiêu đề hiển thị" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
      <MultiSelect
        label="Permission"
        searchable
        data={(catalog.data ?? []).map((p) => ({ value: p.name, label: `${p.name}${p.requiresMfa ? ' (MFA)' : ''}` }))}
        value={permissions}
        onChange={setPermissions}
      />
      <Button loading={create.isPending} onClick={() => create.mutate(undefined, { onSuccess: onDone })}>Tạo</Button>
    </Stack>
  );
}
