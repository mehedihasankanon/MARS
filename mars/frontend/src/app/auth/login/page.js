"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

/**
 * =====================================================================
 * LOGIN PAGE — /auth/login
 * =====================================================================
 *
 * PURPOSE: Let existing users sign in with email + password.
 *
 * HOW IT WORKS (step by step):
 * 1. User fills in email and password in the form
 * 2. User clicks "Sign In" → handleSubmit() is called
 * 3. handleSubmit() calls login() from AuthContext
 * 4. AuthContext sends POST /api/auth/login to Express backend
 * 5. Backend checks credentials against PostgreSQL database
 * 6. If valid → returns JWT token + user data
 * 7. AuthContext stores JWT in localStorage & redirects to homepage
 * 8. If invalid → shows error message on the form
 *
 * BACKEND ENDPOINT: POST /api/auth/login
 * REQUEST BODY:     { email, password }
 * RESPONSE:         { message, token, user, role }
 *
 * STATE VARIABLES:
 * - email:     what the user typed in the email field
 * - password:  what the user typed in the password field
 * - error:     error message to display (empty = no error)
 * - isLoading: true while waiting for backend response
 * =====================================================================
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Get the login function from global auth state

  /**
   * handleSubmit — Runs when the form is submitted
   *
   * e.preventDefault() stops the browser from reloading the page
   * (default HTML form behavior). We handle submission with JavaScript instead.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");        // Clear any previous error
    setIsLoading(true);  // Show loading state on button

    try {
      await login(email, password); // Sends request to backend
      // On success: AuthContext redirects to homepage automatically
    } catch (err) {
      // On failure: show the error from the backend (or a fallback message)
      setError(
        err.response?.data?.error || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false); // Always re-enable the button
    }
  };

  return (
    /* ── PAGE CONTAINER ─────────────────────────────────────
       min-h-screen = takes full viewport height
       flex + items-center + justify-center = centers the form card
       ─────────────────────────────────────────────────────── */
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">

      {/* ── FORM CARD ───────────────────────────────────────
           Dark card with subtle border, centered on the page
           max-w-md = caps width at 448px for readability
           ─────────────────────────────────────────────────── */}
      <div className="max-w-md w-full space-y-8 bg-[#111111] p-8 rounded-2xl border border-[#2A2A2A] shadow-2xl">

        {/* ── HEADER: Title + Link to Register ─────────── */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Sign in to <span className="text-[#E85D26]">MARS</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-[#E85D26] hover:text-[#FF7A45] font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>

        {/* ── ERROR MESSAGE ────────────────────────────────
             Only shows when "error" state is not empty.
             Red-tinted box with the error text.
             ─────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ── LOGIN FORM ────────────────────────────────────
             onSubmit={handleSubmit} = calls our function when submitted
             Each field uses controlled components (value + onChange)
             ─────────────────────────────────────────────── */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

          {/* Email Input Field */}
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
              placeholder="john@example.com"
            />
          </div>

          {/* Password Input Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button — disabled while loading to prevent double-submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-[#E85D26] hover:bg-[#D14F1E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E85D26] focus:ring-offset-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#E85D26]/20"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
