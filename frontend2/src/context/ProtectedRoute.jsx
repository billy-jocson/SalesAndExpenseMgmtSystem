import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { userContext } from "./UserContext";
import { NavRoutes } from "../NavRoutes";

export default function ProtectedRoute({ path }) {
  const { isAuthenticated, canAccess, role } = useContext(userContext);

  if (!isAuthenticated) {
    return <Navigate to={NavRoutes.LOGIN} replace />;
  }

  const fallbackRoute =
    role === "supplier" ? NavRoutes.PRODMANAGER : NavRoutes.DASHBOARD;

  return canAccess(path) ? <Outlet /> : <Navigate to={fallbackRoute} replace />;
}
