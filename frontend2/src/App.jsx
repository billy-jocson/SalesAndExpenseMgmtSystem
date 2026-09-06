import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { CookiesProvider } from "react-cookie";
import { NavRoutes } from "./NavRoutes";

export default function App() {
  return (
    <CookiesProvider>
      <Routes>
        <Route path={NavRoutes.LOGIN || "/"} element={<LoginPage />} />
        <Route path={NavRoutes.DASHBOARD} element={<Dashboard />} />
        <Route path="*" element={<Navigate to={NavRoutes.HOME} replace />} />
      </Routes>
    </CookiesProvider>
  );
}
