import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider } from 'react-router';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthProvider, RequireAccount, RequireSession } from '../features/auth/AuthRoutes';
import { LoginPage, WorkspaceOnboarding } from '../features/auth/AuthPages';
import { AccountLayout } from '../features/account/AccountLayout';
import { WorkspacesPage } from '../features/account/WorkspacesPage';
import { WorkspaceDetailPage } from '../features/account/WorkspaceDetailPage';
import { AccountInfoPage } from '../features/account/AccountInfoPage';
import { EventsExportPage } from '../features/account/EventsExportPage';
import { EventsExportFormPage } from '../features/account/EventsExportFormPage';
import { BarricadePage } from '../features/account/BarricadePage';
import { lazy, Suspense } from 'react';
import { navigation } from './navigation';
import { SignalLinkPage } from '../features/attention/SignalLinkPage';
import { DemoAccountGate } from '../features/demo/DemoAccountGate';

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
    {/* Admin 059: the link of a Slack message. It needs a session, not a chosen workspace:
        it opens the workspace and the environment of the signal itself. */}
    <Route element={<RequireAccount />}><Route path="/inbox/:signalId" element={<SignalLinkPage />} /></Route>
    {/* Admin 066: the account area is not part of the public demo. */}
    <Route element={<RequireAccount />}><Route element={<DemoAccountGate />}><Route path="/account" element={<AccountLayout />}>
      <Route index element={<Navigate to="/account/workspaces" replace />} />
      <Route path="workspaces" element={<WorkspacesPage />} />
      <Route path="workspaces/:tenantId" element={<WorkspaceDetailPage />} />
      <Route path="events-export" element={<EventsExportPage />} />
      <Route path="events-export/new" element={<EventsExportFormPage />} />
      <Route path="events-export/:id" element={<EventsExportFormPage />} />
      <Route path="barricade" element={<BarricadePage />} />
      <Route path="info" element={<AccountInfoPage />} />
      {/* Layout prototypes of the account area (Admin 063): development server only, inside the account layout. */}
      {PrototypePage ? <Route path="prototype/*" element={<Suspense fallback={null}><PrototypePage /></Suspense>} /> : null}
    </Route></Route></Route>
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
