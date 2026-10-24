import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AdminLayout } from '../layouts/AdminLayout';
import { navigation } from './navigation';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          {navigation.map(({ path, Page, children }) => (
            <Route key={path} path={path} element={<Page />}>
              {children?.map(({ path: childPath, Page: ChildPage }) =>
                childPath ? (
                  <Route key={childPath} path={childPath} element={<ChildPage />} />
                ) : (
                  <Route key="index" index element={<ChildPage />} />
                ),
              )}
            </Route>
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
