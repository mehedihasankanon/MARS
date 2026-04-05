"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      api
        .get("/users/profile")
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: newToken, user: userData, role, seller_pending_approval } = res.data;

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser({ ...userData, role, seller_pending_approval: !!seller_pending_approval });
    router.push("/");

    return res.data;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    const { token: newToken, user: userData, role, seller_pending_approval } = res.data;

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser({ ...userData, role: role || "customer", seller_pending_approval: !!seller_pending_approval });
    if (!seller_pending_approval) {
      router.push("/");
    }

    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/");
  };

  const becomeSeller = async (shopName) => {
    const res = await api.post("/users/become-seller", { shopName });
    setUser((prev) => ({ ...prev, seller_pending_approval: true }));

    return res.data;
  };

  const updateUser = (fields) => {
    setUser((prev) => ({ ...prev, ...fields }));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, becomeSeller, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
