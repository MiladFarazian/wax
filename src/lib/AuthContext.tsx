import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { restore, signOut as doSignOut, type AuthStatus } from "./auth";

interface AuthContextValue {
  status: AuthStatus;
  setStatus: (s: AuthStatus) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Restores the on-device session on launch and exposes auth status app-wide. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;
    restore().then((s) => active && setStatus(s));
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    await doSignOut();
    setStatus("signed_out");
  }

  return (
    <AuthContext.Provider value={{ status, setStatus, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
