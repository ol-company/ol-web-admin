// Ghép provider (Mantine, React Query, thông báo) và router
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuditPage } from '../features/audit/AuditPage';
import { BindingsPage } from '../features/bindings/BindingsPage';
import { GroupsPage } from '../features/groups/GroupsPage';
import { RolesPage } from '../features/roles/RolesPage';
import { TenantsPage } from '../features/tenants/TenantsPage';
import { UsersPage } from '../features/users/UsersPage';
import { ItemsPage } from '../features/warehouses/ItemsPage';
import { WarehousesPage } from '../features/warehouses/WarehousesPage';
import { ApiError } from '../shared/api/http';
import type { RuntimeConfig } from '../shared/config';
import { AppLayout, HomeRedirect } from './AppLayout';
import { AuthGate } from './AuthGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Không retry lỗi 4xx (thiếu quyền, không tìm thấy); retry tối đa 2 lần cho lỗi mạng/5xx
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      refetchOnWindowFocus: false,
    },
  },
});

export function App({ config }: { config: RuntimeConfig }) {
  const router = createBrowserRouter([
    {
      element: <AppLayout config={config} />,
      children: [
        { index: true, element: <HomeRedirect /> },
        { path: 'platform/tenants', element: <TenantsPage /> },
        { path: 't/:tenantId/warehouses', element: <WarehousesPage /> },
        { path: 't/:tenantId/warehouses/:warehouseId', element: <ItemsPage /> },
        { path: 't/:tenantId/users', element: <UsersPage /> },
        { path: 't/:tenantId/groups', element: <GroupsPage /> },
        { path: 't/:tenantId/roles', element: <RolesPage /> },
        { path: 't/:tenantId/bindings', element: <BindingsPage /> },
        { path: 't/:tenantId/audit', element: <AuditPage /> },
      ],
    },
  ]);

  return (
    <MantineProvider defaultColorScheme="auto">
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <RouterProvider router={router} />
        </AuthGate>
      </QueryClientProvider>
    </MantineProvider>
  );
}
