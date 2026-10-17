import { createContext } from "react";

export const userContext = createContext(null);

// Itira na lang natin ang Administrator para palaging all-access.
// Ang lahat ng ibang roles (pati Cashier, Inventory, etc.) ay bubuksan
// na base sa eksaktong kinlick mong checkboxes sa database.
export const ROLE_PERMISSIONS = {
  administrator: "*",
  supplier: ["/dashboard", "/productsmanager", "/awaiting-orders"],
};

// Ito ang mag-ta-translate ng database checkbox (hal. "Sales")
// papunta sa mismong links ng system ("/pos", "/sales")
const MODULE_ROUTES = {
  Sales: ["/pos", "/sales"],
  Inventory: ["/productsmanager", "/restockproducts", "/awaiting-orders"],
  Expenses: ["/expenses"],
  Suppliers: ["/suppliermanager"],
  Staff: ["/staffmanager"],
};

export function permissionsToRoutes(permissions = {}) {
  const routes = new Set(["/dashboard"]); // Lahat may access sa dashboard
  Object.entries(permissions).forEach(([module, actions]) => {
    // Kung may na-check na checkbox, ibigay ang access sa corresponding routes
    if (Array.isArray(actions) && actions.length > 0 && MODULE_ROUTES[module]) {
      MODULE_ROUTES[module].forEach((route) => routes.add(route));
    }
  });
  return Array.from(routes);
}
