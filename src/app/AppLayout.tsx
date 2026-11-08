// Khung giao diện: thanh trên (môi trường, chọn tenant, đăng xuất) + menu trái theo quyền
import { AppShell, Badge, Button, Group, NavLink, Select, Text } from '@mantine/core';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { useLogout, useMe, usePermissions } from '../features/me/hooks';
import type { RuntimeConfig } from '../shared/config';
import { QueryState } from '../shared/ui/QueryState';

export function AppLayout({ config }: { config: RuntimeConfig }) {
  const me = useMe(true);
  const logout = useLogout();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Layout cha không nhận được params của route con → đọc tenantId từ URL /t/<tenantId>/...
  const tenantId = /^\/t\/([^/]+)/.exec(pathname)?.[1];
  const { can } = usePermissions(tenantId ? `tenants/${tenantId}` : undefined);
  const isPlatformAdmin = me.data?.platform.permissions.includes('platform.tenants.list') ?? false;

  const items = [
    { to: 'warehouses', label: 'Kho', show: can('warehouse.warehouses.list') },
    { to: 'users', label: 'Người dùng', show: can('iam.users.list') },
    { to: 'groups', label: 'Nhóm', show: can('iam.groups.list') },
    { to: 'roles', label: 'Role', show: can('iam.roles.list') },
    { to: 'bindings', label: 'Gán quyền', show: can('iam.roleBindings.list') },
    { to: 'audit', label: 'Audit log', show: can('iam.audit.list') },
  ];

  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Text fw={700}>{config.appName}</Text>
            {config.environment !== 'prod' && <Badge color="orange">{config.environment}</Badge>}
          </Group>
          <Group>
            <Select
              aria-label="Tenant"
              placeholder="Chọn tenant"
              value={tenantId ?? null}
              data={(me.data?.tenants ?? []).map((t) => ({ value: t.id, label: t.name }))}
              onChange={(v) => v && navigate(`/t/${v}/warehouses`)}
            />
            <Text size="sm">{me.data?.user.email}</Text>
            <Button
              variant="default"
              size="xs"
              loading={logout.isPending}
              onClick={() => logout.mutate()}
            >
              Đăng xuất
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="xs">
        {tenantId &&
          items
            .filter((i) => i.show)
            .map((i) => (
              <NavLink
                key={i.to}
                component={Link}
                to={`/t/${tenantId}/${i.to}`}
                label={i.label}
                active={pathname.includes(`/${i.to}`)}
              />
            ))}
        {isPlatformAdmin && (
          <NavLink
            component={Link}
            to="/platform/tenants"
            label="Quản lý tenant"
            active={pathname.startsWith('/platform')}
          />
        )}
      </AppShell.Navbar>
      <AppShell.Main>
        <QueryState isLoading={me.isLoading} error={me.error}>
          <Outlet />
        </QueryState>
      </AppShell.Main>
    </AppShell>
  );
}

// Trang gốc: vào tenant đầu tiên, hoặc trang platform nếu là platform admin không thuộc tenant nào
export function HomeRedirect() {
  const me = useMe(true);
  if (me.isLoading) return null;
  const first = me.data?.tenants[0];
  if (first) return <Navigate to={`/t/${first.id}/warehouses`} replace />;
  if (me.data?.platform.permissions.includes('platform.tenants.list'))
    return <Navigate to="/platform/tenants" replace />;
  return <Text>Tài khoản chưa thuộc tenant nào. Hãy liên hệ quản trị viên.</Text>;
}
