"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetLink("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setMessage(res.data.message || "Check the link below to reset your password.");
      if (res.data.resetLink) {
        setResetLink(res.data.resetLink);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#111111] p-8 rounded-2xl border border-[#2A2A2A] shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Reset <span className="text-[#E85D26]">password</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your account email. If it exists, you&apos;ll get a one-time reset link (demo: shown on this page).
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 rounded-lg text-sm space-y-2">
            <p>{message}</p>
            {resetLink && (
              <div className="pt-2 border-t border-green-800/50">
                <p className="text-xs text-gray-400 mb-1">Reset link (copy or open):</p>
                <a
                  href={resetLink}
                  className="text-[#E85D26] text-xs break-all underline hover:text-[#FF7A45]"
                >
                  {resetLink}
                </a>
              </div>
            )}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-[#E85D26] hover:bg-[#D14F1E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E85D26] focus:ring-offset-[#111111] disabled:opacity-50 transition-all"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          <Link href="/auth/login" className="text-[#E85D26] hover:text-[#FF7A45] font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
