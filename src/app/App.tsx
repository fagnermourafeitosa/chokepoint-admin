import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AdminShell } from './AdminShell';
import { navigation } from './navigation';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminShell />}>
          {navigation.map(({ path, Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
