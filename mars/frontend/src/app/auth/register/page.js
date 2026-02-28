"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

/**
 * =====================================================================
 * REGISTER PAGE — /auth/register
 * =====================================================================
 *
 * PURPOSE: Let new users create an account (as Customer or Seller).
 *
 * HOW NEXT.JS ROUTING WORKS:
 *   This file is at: frontend/src/app/auth/register/page.js
 *   Next.js automatically maps this to URL: /auth/register
 *   No router configuration needed — the FOLDER STRUCTURE IS the routing.
 *
 * FLOW:
 * 1. User fills in the registration form (name, email, password, role)
 * 2. Client-side validation checks passwords match & length ≥ 6
 * 3. handleSubmit() calls register() from AuthContext
 * 4. AuthContext sends POST /api/auth/register to Express backend
 * 5. Backend creates user in PostgreSQL → returns JWT token
 * 6. AuthContext stores JWT in localStorage → redirects to homepage
 *
 * BACKEND ENDPOINT: POST /api/auth/register
 * REQUEST BODY:     { username, email, password, firstName, lastName, phone, role }
 * RESPONSE:         { message, token, user }
 *
 * STATE:
 * - formData:  object holding all form field values
 * - error:     validation or server error message
 * - isLoading: true while request is in flight
 * =====================================================================
 */
export default function RegisterPage() {
  /* ── FORM STATE ─────────────────────────────────────────
     All form fields stored in a single object.
     Each field has a matching name="" attribute in the JSX.
     When user types, handleChange() updates the right field.
     ─────────────────────────────────────────────────────── */
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer", // default = buyer (can switch to "seller")
  });

  const [error, setError] = useState("");            // Error message string
  const [isLoading, setIsLoading] = useState(false);  // Loading spinner state
  const { register } = useAuth();                     // register() from AuthContext

  /**
   * handleChange — Generic change handler for ALL form fields.
   *
   * HOW IT WORKS:
   *   e.target.name  = the "name" attribute of the input (e.g., "email")
   *   e.target.value = what the user typed (e.g., "test@example.com")
   *
   *   { ...formData, [name]: value } = copy all fields, then overwrite
   *   just the one that changed. This is called the "spread operator pattern".
   *
   * EXAMPLE: User types "John" into firstName field
   *   → name = "firstName", value = "John"
   *   → formData becomes { ...old, firstName: "John" }
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  /**
   * handleSubmit — Validates form data, then sends to backend.
   *
   * VALIDATION STEPS:
   * 1. Check passwords match (client-side, instant feedback)
   * 2. Check password length ≥ 6 (client-side)
   * 3. Send to backend (server-side validation may catch more)
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default HTML form submission (page reload)
    setError("");

    // ── Client-side validation ──
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return; // Stop here — don't send to backend
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Send to backend via AuthContext.register()
      // We EXCLUDE confirmPassword — backend doesn't need it
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
      });
      // On success → AuthContext stores JWT and redirects to homepage
    } catch (err) {
      // err.response.data comes from Express backend
      // e.g., "Email already in use" or "Username taken"
      setError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* ── PAGE CONTAINER ─────────────────────────────────────
       Full-height dark background with centered form card.
       py-12 = vertical padding so form doesn't touch edges.
       ─────────────────────────────────────────────────────── */
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">

      {/* ── FORM CARD ───────────────────────────────────────
           Dark elevated card with border for depth.
           max-w-md = caps at 448px width.
           ─────────────────────────────────────────────────── */}
      <div className="max-w-md w-full space-y-8 bg-[#111111] p-8 rounded-2xl border border-[#2A2A2A] shadow-2xl">

        {/* ── HEADER ────────────────────────────────────── */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Create your <span className="text-[#E85D26]">account</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#E85D26] hover:text-[#FF7A45] font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* ── ERROR MESSAGE — Only shows when error state is non-empty ── */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ── REGISTRATION FORM ──────────────────────────── */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>

          {/* ── ROW 1: First Name + Last Name (side by side) ── 
               grid grid-cols-2 = two equal columns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* ── Username Field ──────────────────────────── */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
              placeholder="johndoe"
            />
          </div>

          {/* ── Email Field ─────────────────────────────── */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
              placeholder="john@example.com"
            />
          </div>

          {/* ── Phone Field ─────────────────────────────── */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
              placeholder="01XXXXXXXXX"
            />
          </div>

          {/* ── Password Field ──────────────────────────── */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* ── Confirm Password Field ──────────────────── */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* ── ROLE SELECTION ──────────────────────────────
               Two toggle buttons: Customer (buyer) or Seller.
               Clicking one sets formData.role to the corresponding value.
               The selected button gets an orange highlight.
               ─────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              I want to
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Customer (Buyer) Button */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "customer" })}
                className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                  formData.role === "customer"
                    ? "border-[#E85D26] bg-[#E85D26]/10 text-[#E85D26]"
                    : "border-[#2A2A2A] text-gray-400 hover:border-[#333]"
                }`}
              >
                <span className="block text-2xl mb-1">🛒</span>
                <span className="text-sm font-medium">Buy Products</span>
              </button>
              {/* Seller Button */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "seller" })}
                className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                  formData.role === "seller"
                    ? "border-[#E85D26] bg-[#E85D26]/10 text-[#E85D26]"
                    : "border-[#2A2A2A] text-gray-400 hover:border-[#333]"
                }`}
              >
                <span className="block text-2xl mb-1">🏪</span>
                <span className="text-sm font-medium">Sell Products</span>
              </button>
            </div>
          </div>

          {/* ── SUBMIT BUTTON ──────────────────────────── */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-[#E85D26] hover:bg-[#D14F1E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E85D26] focus:ring-offset-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#E85D26]/20"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
