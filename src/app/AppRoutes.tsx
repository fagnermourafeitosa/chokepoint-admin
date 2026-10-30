import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider } from 'react-router';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthProvider, RequireSession } from '../features/auth/AuthRoutes';
import { LoginPage, WorkspacePage, WorkspaceOnboarding } from '../features/auth/AuthPages';
import { navigation } from './navigation';

// A data router provides one navigation blocker for the shared Inbox detail flow.
const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<AuthProvider><Outlet /></AuthProvider>}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<LoginPage signup />} />
    <Route path="/workspaces" element={<WorkspacePage />} />
    <Route path="/onboarding/workspace" element={<WorkspaceOnboarding />} />
    <Route element={<RequireSession />}><Route element={<AdminLayout />}>
      {navigation.map(({ path, Page, children }) => <Route key={path} path={path} element={<Page />}>
        {children?.map(({ path: childPath, Page: ChildPage }) => childPath ? <Route key={childPath} path={childPath} element={<ChildPage />} /> : <Route key="index" index element={<ChildPage />} />)}
      </Route>)}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route></Route>
  </Route>,
));
export function AppRoutes() { return <RouterProvider router={router} />; }
