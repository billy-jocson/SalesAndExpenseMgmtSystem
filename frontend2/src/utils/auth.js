import { jwtDecode } from "jwt-decode";

// Name of the cookie that holds the JWT returned by POST /login.
export const AUTH_COOKIE = "token";

// Session cookie (no expiry) so the user is signed out when the browser closes.
export const authCookieOptions = () => ({
  path: "/",
  sameSite: "strict",
  secure: window.location.protocol === "https:",
});

// Which app routes each permission module unlocks.
const MODULE_ROUTES = {
  Sales: ["/pos", "/sales"],
  Inventory: [
    "/productsmanager",
    "/restockproducts",
    "/awaiting-orders",
    "/orders",
  ],
  Expenses: ["/expenses"],
  Suppliers: ["/suppliermanager"],
  Staff: ["/staffmanager", "/rolemanager"],
  Staffs: ["/staffmanager", "/rolemanager"],
  Reports: ["/reports"],
  "Vendor Portal": ["/productsmanager", "/awaiting-orders"],
};

// Returns the decoded JWT payload, or null when the token is missing/invalid.
export function decodeToken(token) {
  if (!token || typeof token !== "string") return null;

  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

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

// Accepts both "read_sales" and "sales_read" style names.
export function userHasPermission(permissions, permissionName) {
  if (!Array.isArray(permissions)) return false;

  const requested = permissionName.toLowerCase().split("_");
  return permissions.some((permission) => {
    const granted = permission.permission_name?.toLowerCase().split("_");
    return (
      granted?.join("_") === requested.join("_") ||
      (granted?.length === 2 &&
        requested.length === 2 &&
        granted[0] === requested[1] &&
        granted[1] === requested[0])
    );
  });
}