import { useState } from "react";
import { permissionsToRoutes, userContext } from "./UserContext";
import { jwtDecode } from "jwt-decode";

function getStoredUser() {
  try {
    const token = sessionStorage.getItem("data");
    if (!token) return null;

    let actualToken;
    try {
      const parsed = JSON.parse(token);
      actualToken =
        typeof parsed === "string" ? parsed : (parsed?.user ?? null);
    } catch {
      actualToken = token;
    }

    return actualToken ? jwtDecode(actualToken) : null;
  } catch {
    return null;
  }
}

export default function ContextProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const permissions = permissionsToRoutes(user?.permissions);

  const setSession = (token) => {
    if (!token) {
      setUser(null);
      sessionStorage.removeItem("data");
      return;
    }

    const decodedUser = jwtDecode(token);
    setUser(decodedUser);
    sessionStorage.setItem("data", token);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("data");
  };

  const canAccess = (path) => permissions.includes(path);
  const hasPermission = (permissionName) => {
    if (!Array.isArray(user?.permissions)) return false;

    const requested = permissionName.toLowerCase().split("_");
    return user.permissions.some((permission) => {
      const granted = permission.permission_name?.toLowerCase().split("_");
      return (
        granted?.join("_") === requested.join("_") ||
        (granted?.length === 2 &&
          requested.length === 2 &&
          granted[0] === requested[1] &&
          granted[1] === requested[0])
      );
    });
  };

  return (
    <userContext.Provider
      value={{
        user,
        role: user?.role?.trim().toLowerCase() ?? "",
        isAuthenticated: Boolean(user),
        canAccess,
        hasPermission,
        setSession,
        logout,
      }}
    >
      {children}
    </userContext.Provider>
  );
}
