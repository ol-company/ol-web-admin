// Trang dành cho platform admin: tạo tenant kèm quản trị viên đầu tiên
import { Button, Group, Stack, Table, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '../../shared/api/http';
import { QueryState } from '../../shared/ui/QueryState';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: string;
}

export function TenantsPage() {
  const qc = useQueryClient();
  const tenants = useQuery({ queryKey: ['platform-tenants'], queryFn: () => api.get<Tenant[]>('/api/iam/v1/tenants') });
  const [form, setForm] = useState({ slug: '', name: '', adminEmail: '' });
  const create = useMutation({
    mutationFn: () => api.post<Tenant>('/api/iam/v1/tenants', form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['platform-tenants'] });
      setForm({ slug: '', name: '', adminEmail: '' });
      notifications.show({ color: 'green', message: 'Đã tạo tenant và gửi lời mời quản trị viên' });
    },
    onError: (e) => notifications.show({ color: 'red', message: errorMessage(e) }),
  });

  return (
    <Stack>
      <Title order={2}>Tenant (platform)</Title>
      <Group align="end">
        <TextInput label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.currentTarget.value })} />
        <TextInput label="Tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} />
        <TextInput label="Email quản trị viên" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.currentTarget.value })} />
        <Button loading={create.isPending} onClick={() => create.mutate()}>Tạo tenant</Button>
      </Group>
      <QueryState isLoading={tenants.isLoading} error={tenants.error}>
        <Table>
          <Table.Tbody>
            {tenants.data?.map((t) => (
              <Table.Tr key={t.id}>
                <Table.Td>{t.slug}</Table.Td>
                <Table.Td>{t.name}</Table.Td>
                <Table.Td>{t.status}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </QueryState>
    </Stack>
  );
}
