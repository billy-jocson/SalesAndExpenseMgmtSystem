import { Route, Routes } from "react-router-dom";
import { NavRoutes } from "./NavRoutes";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import ProductsManager from "./pages/ProductsManager";
import Sales from "./pages/Sales";
import Expenses from "./pages/Expenses";
import SupplierManager from "./pages/SupplierManager";
import RestockProducts from "./pages/RestockProducts";
import Reports from "./pages/Reports";
import StaffManager from "./pages/StaffManager";
import NotFound from "./pages/NotFound";
import ContextProvider from "./context/ContextProvider";
import ProtectedRoute from "./context/ProtectedRoute";

export default function App() {
  return (
    <div className="box-border h-dvh w-screen scrollbar-thin scrollbar-thumb-slate-400 hover:scrollbar-thumb-slate-500 p-4">
      <ContextProvider>
        <Routes>
          <Route path={NavRoutes.LOGIN} element={<LoginPage />} />
          <Route element={<ProtectedRoute path={NavRoutes.DASHBOARD} />}>
            <Route path={NavRoutes.DASHBOARD} element={<Dashboard />} />
          </Route>
          <Route element={<ProtectedRoute path={NavRoutes.POS} />}>
            <Route path={NavRoutes.POS} element={<POS />} />
          </Route>
          <Route element={<ProtectedRoute path={NavRoutes.PRODMANAGER} />}>
            <Route path={NavRoutes.PRODMANAGER} element={<ProductsManager />} />
          </Route>
          <Route element={<ProtectedRoute path={NavRoutes.SALES} />}>
            <Route path={NavRoutes.SALES} element={<Sales />} />
          </Route>
          <Route element={<ProtectedRoute path={NavRoutes.EXPENSES} />}>
            <Route path={NavRoutes.EXPENSES} element={<Expenses />} />
          </Route>
          <Route element={<ProtectedRoute path={NavRoutes.SUPMANAGER} />}>
            <Route path={NavRoutes.SUPMANAGER} element={<SupplierManager />} />
          </Route>
          <Route element={<ProtectedRoute path={NavRoutes.RESTOCKPROD} />}>
            <Route path={NavRoutes.RESTOCKPROD} element={<RestockProducts />} />
          </Route>
          <Route element={<ProtectedRoute path={NavRoutes.REPORTS} />}>
            <Route path={NavRoutes.REPORTS} element={<Reports />} />
          </Route>
          <Route element={<ProtectedRoute path={NavRoutes.STAFFMANAGER} />}>
            <Route path={NavRoutes.STAFFMANAGER} element={<StaffManager />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ContextProvider>
    </div>
  );
}
