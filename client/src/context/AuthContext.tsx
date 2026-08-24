import { createContext, useState, useEffect, useContext, type ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => "Auth not ready",
  logout: async () => {},
  refreshSession: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current session + role from backend
  const refreshSession = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/get-session`, {
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();
      if (!data?.user) {
        setUser(null);
        return;
      }

      // Fetch role from /api/me since Better Auth session may not include it
      try {
        const meRes = await fetch(`${API_URL}/api/me`, {
          credentials: "include",
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: meData.role,
          });
          return;
        }
      } catch {
        // Fall back to session data only
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        try {
          const errData = await res.json();
          if (errData?.message) return errData.message;
          if (errData?.error) return errData.error;
        } catch {}
        return "Invalid email or password";
      }

      await refreshSession();
      return null;
    } catch {
      return "Unable to connect to backend server.";
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors — clear local state regardless
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
