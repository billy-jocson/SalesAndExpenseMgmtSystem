import { useState } from "react";
import { ROLE_PERMISSIONS, userContext } from "./UserContext";

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
  const role = user?.role?.trim().toLowerCase() ?? "";
  const permissions = ROLE_PERMISSIONS[role] ?? [];

  const setSession = (session) => {
    const nextUser = session?.user ?? session ?? null;
    setUser(nextUser);
    sessionStorage.setItem("data", JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("data");
  };

  const canAccess = (path) => permissions === "*" || permissions.includes(path);

  return (
    <userContext.Provider
      value={{
        user,
        role,
        isAuthenticated: Boolean(user),
        canAccess,
        setSession,
        logout,
      }}
    >
      {children}
    </userContext.Provider>
  );
}
