import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { userContext } from "./UserContext";
import { NavRoutes } from "../NavRoutes";

export default function ProtectedRoute({ path }) {
  const { isAuthenticated, canAccess } = useContext(userContext);

  if (!isAuthenticated) {
    return <Navigate to={NavRoutes.LOGIN} replace />;
  }

  return canAccess(path) ? (
    <Outlet />
  ) : (
    <Navigate to={NavRoutes.DASHBOARD} replace />
  );
}
