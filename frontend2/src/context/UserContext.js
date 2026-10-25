import { createContext } from "react";

export const userContext = createContext(null);

const MODULE_ROUTES = {
  Sales: ["/pos", "/sales"],
  Inventory: ["/productsmanager", "/restockproducts", "/awaiting-orders"],
  Expenses: ["/expenses"],
  Suppliers: ["/suppliermanager"],
  Staff: ["/staffmanager", "/rolemanager"],
  Staffs: ["/staffmanager", "/rolemanager"],
  Reports: ["/reports"],
  "Vendor Portal": ["/productsmanager", "/awaiting-orders"],
};

export function permissionsToRoutes(permissions = {}) {
  const routes = new Set(["/dashboard"]);

  if (Array.isArray(permissions)) {
    permissions.forEach(({ module }) => {
      MODULE_ROUTES[module]?.forEach((route) => routes.add(route));
    });
  } else if (permissions && typeof permissions === "object") {
    Object.entries(permissions).forEach(([module, actions]) => {
      if (Array.isArray(actions) && actions.length > 0) {
        MODULE_ROUTES[module]?.forEach((route) => routes.add(route));
      }
    });
  }

  return Array.from(routes);
}
