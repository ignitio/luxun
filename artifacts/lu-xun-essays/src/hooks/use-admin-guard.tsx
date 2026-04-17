import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";

interface AdminGuardState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  forbidden: boolean;
  user: ReturnType<typeof useAuth>["user"];
  logout: () => void;
}

export function useAdminGuard(): AdminGuardState {
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [forbidden, setForbidden] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/admin");
      return;
    }
    if (!isAuthenticated) return;
    let cancelled = false;
    void fetch("/api/admin/me", { credentials: "include" }).then((res) => {
      if (cancelled) return;
      if (res.status === 403) setForbidden(true);
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, setLocation]);

  return {
    isLoading: isLoading || (isAuthenticated && !checked),
    isAuthenticated,
    isAdmin: isAuthenticated && checked && !forbidden,
    forbidden,
    user,
    logout,
  };
}
