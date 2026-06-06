"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const TOKEN_KEY = "auth_token";

type AuthUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_superuser?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshSeq = useRef(0);

  const refreshMe = useCallback(async () => {
    const seq = ++refreshSeq.current;
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      if (seq === refreshSeq.current) {
        setUser(null);
        setToken(null);
      }
      return;
    }

    const tokenAtStart = stored;
    const { apiFetchAuth } = await import("@/lib/api/client");
    try {
      const me = await apiFetchAuth<{
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        is_superuser?: boolean;
      }>("/api/auth/me/", tokenAtStart);

      if (seq !== refreshSeq.current) return;
      if (localStorage.getItem(TOKEN_KEY) !== tokenAtStart) return;

      setUser(me);
      setToken(tokenAtStart);
    } catch (err) {
      if (seq !== refreshSeq.current) return;
      if (localStorage.getItem(TOKEN_KEY) !== tokenAtStart) return;

      const status =
        err && typeof err === "object" && "status" in err
          ? Number((err as { status: number }).status)
          : 0;

      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      }
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const login = useCallback(async (username: string, password: string) => {
    const { apiFetch } = await import("@/lib/api/client");
    const data = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login/", undefined, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      revalidate: false,
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    refreshSeq.current += 1;
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (payload: {
      username: string;
      password: string;
      first_name?: string;
      last_name?: string;
    }) => {
      const { apiFetch } = await import("@/lib/api/client");
      const data = await apiFetch<{ token: string; user: AuthUser }>(
        "/api/auth/register/",
        undefined,
        {
          method: "POST",
          body: JSON.stringify(payload),
          revalidate: false,
        },
      );
      localStorage.setItem(TOKEN_KEY, data.token);
      refreshSeq.current += 1;
      setToken(data.token);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    refreshSeq.current += 1;
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      try {
        const { apiFetchAuth } = await import("@/lib/api/client");
        await apiFetchAuth("/api/auth/logout/", stored, { method: "POST" });
      } catch {
        /* ignore */
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshMe }),
    [user, token, loading, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
