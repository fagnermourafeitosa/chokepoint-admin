import { useAuth } from "../features/auth/AuthContext";
import { Outlet } from "react-router";
import { AdminHeader } from "../components/header/AdminHeader";
import { AdminEnvironmentContext } from "../app/context/AdminEnvironmentContext";
import { useAdminLayout } from "./hooks/useAdminLayout";
import { navigation } from "../app/navigation";
import "./admin-layout.css";

export function AdminLayout() {
  const auth = useAuth();
  const { currentPage, environment, setEnvironment } = useAdminLayout();

  return (
    <AdminEnvironmentContext.Provider value={environment}>
      <div
        className="admin-layout"
        data-environment={environment.toLowerCase()}
      >
        <title>{`${currentPage?.label ?? "Admin"} | Chokepoint`}</title>
        <a className="admin-skip-link" href="#main-content">
          Skip to content
        </a>
        <AdminHeader
          environment={environment}
          onEnvironmentChange={setEnvironment}
          navigation={navigation}
          accountEmail={auth.session?.user.display_name ?? ""}
        />
        <Outlet />
      </div>
    </AdminEnvironmentContext.Provider>
  );
}
