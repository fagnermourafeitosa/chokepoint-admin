import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider } from 'react-router';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthProvider, RequireAccount, RequireSession } from '../features/auth/AuthRoutes';
import { LoginPage, WorkspaceOnboarding } from '../features/auth/AuthPages';
import { AccountLayout } from '../features/account/AccountLayout';
import { WorkspacesPage } from '../features/account/WorkspacesPage';
import { WorkspaceDetailPage } from '../features/account/WorkspaceDetailPage';
import { AccountInfoPage } from '../features/account/AccountInfoPage';
import { lazy, Suspense } from 'react';
import { navigation } from './navigation';

// Layout prototypes exist only in the development server: a production build has no
// /prototype route and no prototype code (the dead branch and its chunk are removed).
const PrototypePage = import.meta.env.DEV
  ? lazy(() => import('../features/prototype/PrototypePage').then(module => ({ default: module.PrototypePage })))
  : undefined;

// A data router provides one navigation blocker for the shared Inbox detail flow.
const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<AuthProvider><Outlet /></AuthProvider>}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<LoginPage signup />} />
    {/* Admin 051: the account area replaces the workspace page. The first-workspace onboarding stays (Admin 005). */}
    <Route path="/workspaces" element={<Navigate to="/account/workspaces" replace />} />
    <Route path="/onboarding/workspace" element={<WorkspaceOnboarding />} />
    <Route element={<RequireAccount />}><Route path="/account" element={<AccountLayout />}>
      <Route index element={<Navigate to="/account/workspaces" replace />} />
      <Route path="workspaces" element={<WorkspacesPage />} />
      <Route path="workspaces/:tenantId" element={<WorkspaceDetailPage />} />
      <Route path="info" element={<AccountInfoPage />} />
    </Route></Route>
    <Route element={<RequireSession />}><Route element={<AdminLayout />}>
      {navigation.map(({ path, Page, children }) => <Route key={path} path={path} element={<Page />}>
        {children?.map(({ path: childPath, Page: ChildPage }) => childPath ? <Route key={childPath} path={childPath} element={<ChildPage />} /> : <Route key="index" index element={<ChildPage />} />)}
      </Route>)}
      {/* Layout prototypes: development server only, not in the navigation; the specifications link them. */}
      {PrototypePage ? <Route path="/prototype/*" element={<Suspense fallback={null}><PrototypePage /></Suspense>} /> : null}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route></Route>
  </Route>,
));
export function AppRoutes() { return <RouterProvider router={router} />; }
