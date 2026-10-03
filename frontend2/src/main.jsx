import React from "react";
import "./index.css";
import App from "./App.jsx";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { Toast } from "@heroui/react";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CookiesProvider>
      <BrowserRouter>
        <App />
        <Toast.Provider placement="top" />
      </BrowserRouter>
    </CookiesProvider>
  </React.StrictMode>,
);
