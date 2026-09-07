import "./App.css";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import ProductsManager from "./pages/ProductsManager";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import SupplierManager from "./pages/SupplierManager";
import RestockProducts from "./pages/RestockProducts";
import NotFound from "./pages/NotFound";
import { CookiesProvider } from "react-cookie";
import { NavRoutes } from "./NavRoutes";
import useSessionStorage from "./hooks/useSessionStorage";

function ProtectedRoute() {
  const [sessionData] = useSessionStorage("data", null);
  const isSessionEmpty =
    !sessionData ||
    (typeof sessionData === "object" && Object.keys(sessionData).length === 0);

  return isSessionEmpty ? (
    <Navigate to={NavRoutes.LOGIN} replace />
  ) : (
    <Outlet />
  );
}

export default function App() {
  return (
    <div className="box-border h-dvh w-screen overflow-hidden p-4">
      <CookiesProvider>
        <Routes>
          <Route path={NavRoutes.LOGIN || "/"} element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path={NavRoutes.DASHBOARD} element={<Dashboard />} />
            <Route path={NavRoutes.POS} element={<POS />} />
            <Route path={NavRoutes.PRODMANAGER} element={<ProductsManager />} />
            <Route path={NavRoutes.SALES} element={<Sales />} />
            <Route path={NavRoutes.EXPENSES} element={<Expenses />} />
            <Route path={NavRoutes.SUPMANAGER} element={<SupplierManager />} />
            <Route path={NavRoutes.RESTOCKPROD} element={<RestockProducts />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CookiesProvider>
    </div>
  );
}
