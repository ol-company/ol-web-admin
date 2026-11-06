// UI: danh sách thành viên + lời mời. Nút chỉ hiện khi có quyền (UX); backend vẫn kiểm lại.
import { Badge, Button, Group, Modal, MultiSelect, Stack, Table, TextInput, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { useParams } from 'react-router';
import { usePermissions } from '../me/hooks';
import { useRoles } from '../roles/hooks';
import { QueryState } from '../../shared/ui/QueryState';
import { usersApi } from './api';
import { useInvitations, useMembers, useUserAction } from './hooks';

export function UsersPage() {
  const { tenantId = '' } = useParams();
  const members = useMembers(tenantId);
  const invitations = useInvitations(tenantId);
  const { can } = usePermissions(`tenants/${tenantId}`);
  const [opened, { open, close }] = useDisclosure(false);

  const disable = useUserAction(tenantId, (id: string) => usersApi.disable(tenantId, id), 'Đã vô hiệu hóa');
  const enable = useUserAction(tenantId, (id: string) => usersApi.enable(tenantId, id), 'Đã kích hoạt');
  const reset = useUserAction(tenantId, (id: string) => usersApi.resetPassword(tenantId, id), 'Đã gửi email đặt lại mật khẩu');
  const revoke = useUserAction(tenantId, (id: string) => usersApi.revoke(tenantId, id), 'Đã thu hồi lời mời');

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Người dùng</Title>
        {can('iam.users.invite') && <Button onClick={open}>Mời người dùng</Button>}
      </Group>

      <QueryState isLoading={members.isLoading} error={members.error}>
        <Table striped data-testid="members-table">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Trạng thái</Table.Th>
              <Table.Th>MFA</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {members.data?.map((m) => (
              <Table.Tr key={m.id}>
                <Table.Td>{m.email}</Table.Td>
                <Table.Td>
                  <Badge color={m.membershipStatus === 'active' && m.status === 'active' ? 'green' : 'gray'}>
                    {m.membershipStatus === 'disabled' ? 'vô hiệu hóa' : m.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{m.mfaEnrolled ? 'Có' : 'Chưa'}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    {m.membershipStatus === 'active' && can('iam.users.disable') && (
                      <Button size="xs" variant="light" color="red" onClick={() => disable.mutate(m.id)}>Vô hiệu hóa</Button>
                    )}
                    {m.membershipStatus === 'disabled' && can('iam.users.enable') && (
                      <Button size="xs" variant="light" onClick={() => enable.mutate(m.id)}>Kích hoạt</Button>
                    )}
                    {can('iam.users.resetPassword') && (
                      <Button size="xs" variant="subtle" onClick={() => reset.mutate(m.id)}>Đặt lại mật khẩu</Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </QueryState>

      <Title order={4}>Lời mời</Title>
      <QueryState isLoading={invitations.isLoading} error={invitations.error}>
        <Table>
          <Table.Tbody>
            {invitations.data?.map((i) => (
              <Table.Tr key={i.id}>
                <Table.Td>{i.email}</Table.Td>
                <Table.Td>{i.roleIds.join(', ')}</Table.Td>
                <Table.Td><Badge variant="outline">{i.status}</Badge></Table.Td>
                <Table.Td>
                  {i.status === 'pending' && can('iam.users.invite') && (
                    <Button size="xs" variant="subtle" color="red" onClick={() => revoke.mutate(i.id)}>Thu hồi</Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </QueryState>

      <Modal opened={opened} onClose={close} title="Mời người dùng">
        <InviteForm tenantId={tenantId} onDone={close} />
      </Modal>
    </Stack>
  );
}

function InviteForm({ tenantId, onDone }: { tenantId: string; onDone: () => void }) {
  const roles = useRoles(tenantId);
  const [email, setEmail] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const invite = useUserAction(tenantId, () => usersApi.invite(tenantId, { email, roleIds }), 'Đã gửi lời mời');
  return (
    <Stack>
      <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} required />
      <MultiSelect
        label="Role"
        data={(roles.data ?? []).map((r) => ({ value: r.id, label: r.title }))}
        value={roleIds}
        onChange={setRoleIds}
      />
      <Button loading={invite.isPending} disabled={!email || roleIds.length === 0} onClick={() => invite.mutate(undefined, { onSuccess: onDone })}>
        Gửi lời mời
      </Button>
    </Stack>
  );
}
