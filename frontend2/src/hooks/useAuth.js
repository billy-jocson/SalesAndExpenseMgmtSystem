import { useCallback, useMemo } from "react";
import { useCookies } from "react-cookie";
import {
  AUTH_COOKIE,
  authCookieOptions,
  decodeToken,
  permissionsToRoutes,
  userHasPermission,
} from "../utils/auth";

// Reads the signed-in user straight from the auth cookie. react-cookie keeps
// every component using this hook in sync when the cookie is set or removed,
// so no React context provider is needed.
export default function useAuth() {
  const [cookies, setCookie, removeCookie] = useCookies([AUTH_COOKIE]);
  const token = cookies[AUTH_COOKIE];

  const user = useMemo(() => decodeToken(token), [token]);
  const routes = useMemo(
    () => permissionsToRoutes(user?.permissions),
    [user],
  );

  const setSession = useCallback(
    (newToken) => {
      if (!decodeToken(newToken)) {
        removeCookie(AUTH_COOKIE, { path: "/" });
        return;
      }
      setCookie(AUTH_COOKIE, newToken, authCookieOptions());
    },
    [setCookie, removeCookie],
  );

  const logout = useCallback(() => {
    removeCookie(AUTH_COOKIE, { path: "/" });
  }, [removeCookie]);

  const canAccess = useCallback((path) => routes.includes(path), [routes]);
  const hasPermission = useCallback(
    (permissionName) => userHasPermission(user?.permissions, permissionName),
    [user],
  );

  return {
    user,
    role: user?.role?.trim().toLowerCase() ?? "",
    isAuthenticated: Boolean(user),
    canAccess,
    hasPermission,
    setSession,
    logout,
  };
}