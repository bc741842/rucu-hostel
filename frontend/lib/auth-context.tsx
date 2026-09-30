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
  loginStudent: (regNo: string, password: string) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
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

  async function loginStudent(regNo: string, password: string) {
    const res = await api.post("/auth/login", { regNo, password });
    const authUser: AuthUser = { type: "student", regNo };
    Cookies.set("rucu_token", res.data.accessToken, { expires: 7 });
    Cookies.set("rucu_user", JSON.stringify(authUser), { expires: 7 });
    setUser(authUser);
    router.push("/dashboard");
  }

  async function loginAdmin(username: string, password: string) {
    const res = await api.post("/admin/auth/login", { username, password });
    const authUser: AuthUser = {
      type: "admin",
      name: res.data.name,
      role: res.data.role,
    };
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
      value={{
        user,
        loading,
        loginStudent,
        loginAdmin,
        registerStudent,
        logout,
      }}
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
