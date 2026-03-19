import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { AppLoader } from "./AppLoader";

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <AppLoader label="Validando sesion..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
