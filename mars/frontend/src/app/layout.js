import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

/* ── Google Fonts ─────────────────────────────────────────────
   Geist Sans: Used for body text (clean, modern sans-serif)
   Geist Mono: Used for code or monospaced text
   Next.js loads these efficiently via its font optimization.
   ──────────────────────────────────────────────────────────── */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ── Page Metadata ────────────────────────────────────────────
   This sets the <title> and <meta> tags for SEO.
   "icons" tells the browser where to find the favicon.
   ──────────────────────────────────────────────────────────── */
export const metadata = {
  title: "MARS — Marketplace and Retailing System",
  description: "A comprehensive e-commerce platform for buying and selling products. Browse, sell, and shop with confidence on MARS.",
  icons: {
    icon: "/favicon.svg",
  },
};

/* ── Root Layout ──────────────────────────────────────────────
   This wraps EVERY page. It provides:
   1. <html> and <body> tags with fonts applied
   2. <AuthProvider> — global login/logout state (React Context)
   3. <Navbar> — top navigation bar (appears on all pages)
   4. {children} — the actual page content (swapped by routing)

   COMPONENT TREE:
   <html>
     <body>
       <AuthProvider>         ← provides user/login/logout to all children
         <Navbar />           ← sticky top nav bar
         {children}           ← the current page (Home, Login, Register, etc.)
       </AuthProvider>
     </body>
   </html>
   ──────────────────────────────────────────────────────────── */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
