import {
  Button,
  Group as MGroup,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router';
import { errorMessage } from '../../shared/api/http';
import { QueryState } from '../../shared/ui/QueryState';
import { usePermissions } from '../me/hooks';
import { useMembers } from '../users/hooks';
import { groupsApi } from './api';

export function GroupsPage() {
  const { tenantId = '' } = useParams();
  const qc = useQueryClient();
  const groups = useQuery({
    queryKey: ['groups', tenantId],
    queryFn: () => groupsApi.list(tenantId),
  });
  const { can } = usePermissions(`tenants/${tenantId}`);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const onDone = (msg: string) => ({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['groups', tenantId] });
      void qc.invalidateQueries({ queryKey: ['group-members', tenantId] });
      notifications.show({ color: 'green', message: msg });
    },
    onError: (e: unknown) => notifications.show({ color: 'red', message: errorMessage(e) }),
  });
  const create = useMutation({
    mutationFn: () => groupsApi.create(tenantId, { name }),
    ...onDone('Đã tạo nhóm'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => groupsApi.remove(tenantId, id),
    ...onDone('Đã xóa nhóm'),
  });

  return (
    <Stack>
      <Title order={2}>Nhóm</Title>
      {can('iam.groups.create') && (
        <MGroup>
          <TextInput
            placeholder="Tên nhóm"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Button
            disabled={name.length < 2}
            loading={create.isPending}
            onClick={() => create.mutate()}
          >
            Tạo nhóm
          </Button>
        </MGroup>
      )}
      <QueryState isLoading={groups.isLoading} error={groups.error}>
        <Table highlightOnHover>
          <Table.Tbody>
            {groups.data?.map((g) => (
              <Table.Tr key={g.id} onClick={() => setSelected(g.id)} style={{ cursor: 'pointer' }}>
                <Table.Td>{g.name}</Table.Td>
                <Table.Td>{g.memberCount} thành viên</Table.Td>
                <Table.Td>
                  {can('iam.groups.delete') && (
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove.mutate(g.id);
                      }}
                    >
                      Xóa
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </QueryState>
      {selected && (
        <GroupMembers
          tenantId={tenantId}
          groupId={selected}
          canManage={can('iam.groups.manageMembers')}
        />
      )}
    </Stack>
  );
}

function GroupMembers({
  tenantId,
  groupId,
  canManage,
}: {
  tenantId: string;
  groupId: string;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const members = useQuery({
    queryKey: ['group-members', tenantId, groupId],
    queryFn: () => groupsApi.members(tenantId, groupId),
  });
  const tenantMembers = useMembers(tenantId);
  const [userId, setUserId] = useState<string | null>(null);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['group-members', tenantId] });
    void qc.invalidateQueries({ queryKey: ['groups', tenantId] });
  };
  const add = useMutation({
    mutationFn: () => groupsApi.addMember(tenantId, groupId, userId!),
    onSuccess: refresh,
    onError: (e) => notifications.show({ color: 'red', message: errorMessage(e) }),
  });
  const remove = useMutation({
    mutationFn: (u: string) => groupsApi.removeMember(tenantId, groupId, u),
    onSuccess: refresh,
  });

  return (
    <Stack>
      <Title order={4}>Thành viên nhóm</Title>
      {canManage && (
        <MGroup>
          <Select
            placeholder="Chọn người dùng"
            data={(tenantMembers.data ?? []).map((m) => ({ value: m.id, label: m.email }))}
            value={userId}
            onChange={setUserId}
            searchable
          />
          <Button disabled={!userId} onClick={() => add.mutate()}>
            Thêm
          </Button>
        </MGroup>
      )}
      <QueryState isLoading={members.isLoading} error={members.error}>
        {members.data?.length === 0 && <Text c="dimmed">Chưa có thành viên</Text>}
        {members.data?.map((m) => (
          <MGroup key={m.id} justify="space-between">
            <Text>{m.email}</Text>
            {canManage && (
              <Button size="xs" variant="subtle" color="red" onClick={() => remove.mutate(m.id)}>
                Bỏ khỏi nhóm
              </Button>
            )}
          </MGroup>
        ))}
      </QueryState>
    </Stack>
  );
}
