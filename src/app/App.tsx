import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AdminLayout } from '../layouts/AdminLayout';
import { navigation } from './navigation';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          {navigation.map(({ path, Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
