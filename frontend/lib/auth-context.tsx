"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "./api";

type UserType = "student" | "admin";

interface AuthUser {
  type: UserType;
  name?: string;
  regNo?: string;
  role?: string; // super_admin | accountant | warden (admin only)
}

export interface RegisterPayload {
  regNo: string;
  name: string;
  gender: string;
  course: string;
  year: number;
  phone?: string;
  email?: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  registerStudent: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("rucu_token");
    const userJson = Cookies.get("rucu_user");
    if (token && userJson) {
      try {
        setUser(JSON.parse(userJson));
      } catch {
        Cookies.remove("rucu_token");
        Cookies.remove("rucu_user");
      }
    }
    setLoading(false);
  }, []);

  // Login MOJA kwa wote - backend ndio huamua kama ni mwanafunzi au admin
  async function login(identifier: string, password: string) {
    const res = await api.post("/auth/login", { identifier, password });

    const authUser: AuthUser =
      res.data.type === "admin"
        ? { type: "admin", name: res.data.name, role: res.data.role }
        : { type: "student", regNo: identifier };

    Cookies.set("rucu_token", res.data.accessToken, { expires: 7 });
    Cookies.set("rucu_user", JSON.stringify(authUser), { expires: 7 });
    setUser(authUser);
    router.push("/dashboard");
  }

  async function registerStudent(payload: RegisterPayload) {
    const res = await api.post("/auth/register", payload);
    const authUser: AuthUser = { type: "student", regNo: payload.regNo };
    Cookies.set("rucu_token", res.data.accessToken, { expires: 7 });
    Cookies.set("rucu_user", JSON.stringify(authUser), { expires: 7 });
    setUser(authUser);
    router.push("/dashboard");
  }

  function logout() {
    Cookies.remove("rucu_token");
    Cookies.remove("rucu_user");
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, registerStudent, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
