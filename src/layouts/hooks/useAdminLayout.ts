import { useAuth } from "../../features/auth/AuthContext";
import { useLocation } from "react-router";
import { navigation } from "../../app/navigation";
import type { Environment } from "../../app/context/AdminEnvironmentContext";

export function useAdminLayout() {
  const { pathname } = useLocation();
  const currentPage = navigation.find(
    ({ path }) =>
      path === pathname || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
  const a = useAuth();
  const environment: Environment =
    a.environment?.name === "production" ? "Production" : "Sandbox";
  const setEnvironment = (value: Environment) => {
    const record = a.environments.find((e) => e.name === value.toLowerCase());
    if (record) a.chooseEnvironment(record.id);
  };
  return { currentPage, environment, setEnvironment };
}
