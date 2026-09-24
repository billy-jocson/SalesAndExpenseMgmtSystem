import { createContext } from "react";

export const userContext = createContext(null);

export const ROLE_PERMISSIONS = {
  administrator: "*",
  "cashier staff": ["/dashboard", "/pos", "/productsmanager"],
  "expense staff": ["/dashboard", "/expenses"],
  "sales staff": ["/dashboard", "/pos", "/sales"],
  "inventory staff": [
    "/dashboard",
    "/productsmanager",
    "/suppliermanager",
    "/restockproducts",
  ],
  supplier: ["/dashboard", "/productsmanager"],
};
