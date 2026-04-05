import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const reqUrl = error?.config?.url || "";
      const authPath = window.location.pathname.startsWith("/auth");
      const authApiCall = reqUrl.includes("/auth/login") || reqUrl.includes("/auth/register") || reqUrl.includes("/auth/forgot-password") || reqUrl.includes("/auth/reset-password");

      if (!authPath && !authApiCall) {
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
