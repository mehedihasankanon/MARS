import axios from "axios";

/**
 * Axios instance pre-configured to talk to our Express backend.
 *
 * Why a separate file?
 * - Base URL is set once (not repeated in every component).
 * - We attach the JWT token automatically to every request via an interceptor,
 *   so individual pages don't need to manually add Authorization headers.
 */
const api = axios.create({
  baseURL: "http://localhost:5001/api", // Express backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 *
 * Before EVERY request leaves the browser, this runs.
 * It grabs the JWT token from localStorage and attaches it
 * as a Bearer token in the Authorization header.
 *
 * Flow: Component calls api.get("/users/profile")
 *       → interceptor adds header: Authorization: Bearer <token>
 *       → request goes to backend
 *       → backend's jwt.js middleware verifies the token
 */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
