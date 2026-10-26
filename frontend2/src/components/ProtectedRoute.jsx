import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { NavRoutes } from "../NavRoutes";

export default function ProtectedRoute({ path }) {
  const { isAuthenticated, canAccess } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={NavRoutes.LOGIN} replace />;
  }

  return canAccess(path) ? (
    <Outlet />
  ) : (
    <Navigate to={NavRoutes.DASHBOARD} replace />
  );
}