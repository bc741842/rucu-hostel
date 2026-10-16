import axios from "axios";
import Cookies from "js-cookie";
 
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
});
 
api.interceptors.request.use((config) => {
  const token = Cookies.get("rucu_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Don't hijack auth pages: a wrong password also returns 401 and the
      // page must be able to show its own error message.
      const publicPaths = ["/login", "/register", "/forgot-password"];
      if (!publicPaths.includes(window.location.pathname)) {
        Cookies.remove("rucu_token");
        Cookies.remove("rucu_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
 