"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

/**
 * AuthContext — Global authentication state
 *
 * WHAT IS CONTEXT?
 * React Context is like a "global variable" for your component tree.
 * Instead of passing user/token as props through every component,
 * any component can access auth state by calling useAuth().
 *
 * WHAT THIS PROVIDES:
 * - user: the logged-in user object (or null)
 * - token: the JWT token (or null)
 * - login(email, password): sends login request, stores token
 * - register(formData): sends register request, stores token
 * - logout(): clears token, redirects to home
 * - loading: true while checking if user is already logged in
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * On first load, check if a token exists in localStorage.
   * If so, fetch the user's profile to restore the session.
   * This means refreshing the page doesn't log you out.
   */
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      // Fetch user profile with saved token
      // The backend now returns the `role` field alongside user data,
      // so role-gated features (Dashboard, Cart) work after page refresh.
      api
        .get("/users/profile")
        .then((res) => {
          setUser(res.data); // res.data now includes { ...user fields, role }
        })
        .catch(() => {
          // Token is invalid/expired — clear it
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Login function
   *
   * 1. Sends POST /api/auth/login with email & password
   * 2. Backend returns { token, user, role }
   * 3. We store the token in localStorage (persists across refreshes)
   * 4. We store user in state (available to all components via useAuth)
   * 5. Redirect to homepage
   */
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: newToken, user: userData, role } = res.data;

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser({ ...userData, role });
    router.push("/");

    return res.data;
  };

  /**
   * Register function
   *
   * 1. Sends POST /api/auth/register with form data
   * 2. Backend creates user, returns { token, user }
   * 3. Same flow as login — store token, set user, redirect
   */
  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    const { token: newToken, user: userData } = res.data;

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser({ ...userData, role: formData.role || "customer" });
    router.push("/");

    return res.data;
  };

  /**
   * Logout function
   *
   * Clears token from localStorage and state, then redirects home.
   */
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook
 *
 * Any component can call:
 *   const { user, login, logout } = useAuth();
 *
 * to access the auth state and functions.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
