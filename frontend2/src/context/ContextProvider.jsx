import { useState } from "react";
import { permissionsToRoutes, userContext } from "./UserContext";

function getStoredUser() {
  try {
    const session = JSON.parse(sessionStorage.getItem("data"));
    return session?.user ?? session ?? null;
  } catch {
    return null;
  }
}

export default function ContextProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const permissions = permissionsToRoutes(user?.permissions);

  const setSession = (session) => {
    const nextUser = session?.user ?? session ?? null;
    setUser(nextUser);
    sessionStorage.setItem("data", JSON.stringify(session));
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
