import { ReportOnlyBanner } from '../components/report-only/ReportOnlyBanner';
import { FirstAccessTour } from '../features/onboarding/FirstAccessTour';
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
        <title>{`${currentPage?.label ?? "Admin"} | Xokepoint`}</title>
        <a className="admin-skip-link" href="#main-content">
          Skip to content
        </a>
        <AdminHeader
          environment={environment}
          onEnvironmentChange={setEnvironment}
          navigation={navigation}
          accountEmail={auth.session?.user.email || auth.session?.user.display_name || ""}
        />
        {/* Admin 041: on every screen while the environment has an agent in Report-only. */}
        {auth.session && auth.workspace && auth.environment ? <ReportOnlyBanner key={`report-only:${auth.session.user.id}:${auth.workspace.tenant_id}:${auth.environment.id}`} scope={{ userId: auth.session.user.id, tenantId: auth.workspace.tenant_id, environmentId: auth.environment.id }} production={environment === 'Production'} /> : null}
        <Outlet />
        {/* Admin 052: the guided tour of the Sandbox. */}
        <FirstAccessTour sandbox={environment === 'Sandbox'} />
      </div>
    </AdminEnvironmentContext.Provider>
  );
}
