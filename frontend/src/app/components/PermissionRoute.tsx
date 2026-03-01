import { Navigate, useLocation } from "react-router";
import { ReactNode } from "react";
import { Permission, useAuth } from "../auth/AuthContext";

export function PermissionRoute({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can, defaultPath, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  if (!can(permission)) {
    const target = defaultPath === location.pathname ? "/login" : defaultPath;
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
