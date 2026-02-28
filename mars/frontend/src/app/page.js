'use client';

import Link from 'next/link';
import Image from 'next/image';

/**
 * =====================================================================
 * HOME PAGE — The landing page users see at "/"
 * =====================================================================
 *
 * STRUCTURE (top to bottom):
 * ┌─────────────────────────────────────────┐
 * │  HERO SECTION          — Big welcome    │  Eye-catching intro with
 * │    Logo + Headline     — banner with    │  CTA buttons to explore
 * │    CTA Buttons         — call-to-action │  products or start selling
 * ├─────────────────────────────────────────┤
 * │  FEATURES SECTION      — 3–column grid  │  Showcases why users
 * │    Feature Card 1      — of benefits    │  should choose MARS
 * │    Feature Card 2                       │  (selection, security,
 * │    Feature Card 3                       │   fast shipping)
 * ├─────────────────────────────────────────┤
 * │  HOW IT WORKS SECTION  — Step-by-step   │  Shows the process:
 * │    Step 1 → Step 2 → Step 3             │  Browse → Add → Checkout
 * ├─────────────────────────────────────────┤
 * │  CTA SECTION           — Final push     │  Encourages sign-up
 * │    "Ready to get started?"              │
 * ├─────────────────────────────────────────┤
 * │  FOOTER                — Site links     │  Navigation + copyright
 * │    Explore | Company | Legal            │
 * └─────────────────────────────────────────┘
 *
 * STYLING: Uses Tailwind CSS utility classes for responsive design.
 *   - Dark background (#0A0A0A) with Mars orange (#E85D26) accents
 *   - Fully responsive: single column on mobile, multi-column on desktop
 * =====================================================================
 */
export default function Home() {
  return (
    <div className="bg-[#0A0A0A]">

      {/* ============================================================
          SECTION 1: HERO — The first thing users see
          
          PURPOSE: Grab attention, explain what MARS is, 
                   and give clear actions (Browse / Start Selling).
          
          LAYOUT:
          - Full-width gradient background (dark with orange tint)
          - Centered content with logo, heading, description, buttons
          - On mobile: stacks vertically | On desktop: centered
          ============================================================ */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#1A0E05] via-[#0A0A0A] to-[#0A0A0A] overflow-hidden">

        {/* Decorative background glow — purely visual, creates an 
            orange ambient light effect behind the content */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E85D26] rounded-full opacity-[0.04] blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          {/* MARS LOGO — The brand image from public/mars-logo.svg
              Next.js <Image> automatically optimizes it (lazy loading, sizing)
              NOTE: To use the original PNG logo instead, save it as 
              public/mars-logo.png and change the src below */}
          <div className="flex justify-center mb-8">
            <Image
              src="/mars-logo.png"
              alt="MARS — Marketplace and Retailing System logo"
              width={220}
              height={250}
              priority  
              className="drop-shadow-[0_0_30px_rgba(232,93,38,0.3)]"
            />
            {/* priority = load this image first (it's above the fold)
                drop-shadow = orange glow effect around the logo */}
          </div>

          {/* MAIN HEADING — The "MARS" text uses the orange gradient */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Welcome to{' '}
            <span className="mars-text-gradient">MARS</span>
            {/* mars-text-gradient is defined in globals.css — 
                it applies a gradient fill to the text */}
          </h1>

          {/* TAGLINE — Explains what MARS does in one sentence */}
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your ultimate <span className="text-[#E85D26] font-semibold">Marketplace and Retailing System</span>. 
            Buy and sell products with confidence across the universe.
          </p>

          {/* CTA BUTTONS — Primary (Browse) + Secondary (Start Selling)
              - On mobile: stacked vertically (flex-col)
              - On desktop (sm+): side by side (sm:flex-row) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Primary CTA — Solid orange button */}
            <Link 
              href="/products"
              className="px-8 py-3.5 bg-[#E85D26] text-white font-semibold rounded-lg hover:bg-[#D14F1E] transition-all duration-200 shadow-lg shadow-[#E85D26]/20 hover:shadow-[#E85D26]/40 text-lg"
            >
              Browse Products
            </Link>
            {/* Secondary CTA — Outlined orange button */}
            <Link 
              href="/auth/register"
              className="px-8 py-3.5 bg-transparent text-[#E85D26] font-semibold rounded-lg border-2 border-[#E85D26] hover:bg-[#E85D26]/10 transition-all duration-200 text-lg"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: FEATURES — Why choose MARS?
          
          PURPOSE: Build trust by highlighting 3 key benefits.
          
          LAYOUT: 
          - Section heading centered at top
          - 3 cards in a responsive grid:
            • Mobile: 1 column (stacked)
            • Tablet (md): 3 columns side-by-side
          
          EACH CARD has: Icon → Title → Description
          ============================================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Section heading */}
          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            Why Choose <span className="text-[#E85D26]">MARS</span>?
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Everything you need for a seamless shopping experience
          </p>
          
          {/* Feature cards grid — 3 columns on desktop */}
          <div className="grid md:grid-cols-3 gap-8">

            {/* ── Feature Card 1: Wide Selection ──────────────── */}
            <div className="p-8 bg-[#111111] rounded-xl border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all duration-300 group">
              {/* Icon circle — orange background with emoji */}
              <div className="w-14 h-14 bg-[#E85D26]/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-[#E85D26]/20 transition-colors">
                🛍️
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Wide Selection</h3>
              <p className="text-gray-400 leading-relaxed">
                Browse thousands of products from trusted sellers across multiple categories.
              </p>
            </div>

            {/* ── Feature Card 2: Secure & Safe ───────────────── */}
            <div className="p-8 bg-[#111111] rounded-xl border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#E85D26]/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-[#E85D26]/20 transition-colors">
                🔒
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Secure & Safe</h3>
              <p className="text-gray-400 leading-relaxed">
                Your transactions are protected with industry-leading security and buyer protection.
              </p>
            </div>

            {/* ── Feature Card 3: Fast Shipping ───────────────── */}
            <div className="p-8 bg-[#111111] rounded-xl border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#E85D26]/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-[#E85D26]/20 transition-colors">
                🚀
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Fast Shipping</h3>
              <p className="text-gray-400 leading-relaxed">
                Quick delivery with real-time tracking on all your orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: HOW IT WORKS — Step-by-step guide
          
          PURPOSE: Show users the buying process is simple.
          
          LAYOUT:
          - 3 numbered steps in a responsive grid
          - Each step: Number badge → Title → Description
          - Connecting line between steps (visual flow)
          ============================================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            How It <span className="text-[#E85D26]">Works</span>
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Getting started is easy — just three simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center p-8">
              {/* Step number — orange circle with the number inside */}
              <div className="w-16 h-16 bg-[#E85D26] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-5">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Browse & Discover</h3>
              <p className="text-gray-400">
                Explore products across categories. Use search and filters to find what you need.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-[#E85D26] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-5">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Add to Cart</h3>
              <p className="text-gray-400">
                Select your items and add them to your shopping cart. Adjust quantities anytime.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-[#E85D26] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-5">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Checkout & Enjoy</h3>
              <p className="text-gray-400">
                Complete your purchase securely and track your order until it arrives at your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: CALL TO ACTION — Final signup push
          
          PURPOSE: Convert visitors to registered users.
          STYLE:  Orange gradient background to stand out
          ============================================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Orange gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#E85D26] to-[#F59E0B] opacity-90" />
        {/* Dark overlay pattern for texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+PC9zdmc+')] opacity-30" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of satisfied buyers and sellers on MARS today.
          </p>
          <Link 
            href="/auth/register"
            className="inline-block px-10 py-4 bg-[#0A0A0A] text-[#E85D26] font-bold rounded-lg hover:bg-[#111111] transition-all duration-200 text-lg shadow-2xl"
          >
            Create an Account
          </Link>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: FOOTER — Site navigation & legal info
          
          PURPOSE: Provide navigation links and legal information.
          
          LAYOUT:
          - 4 columns on desktop: Brand | Explore | Company | Legal
          - Single column stacked on mobile
          - Copyright bar at the bottom with divider line
          ============================================================ */}
      <footer className="bg-[#050505] text-gray-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">

          {/* Footer columns grid */}
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            
            {/* Column 1: Brand info */}
            <div>
              <h4 className="text-[#E85D26] font-bold text-lg mb-4">MARS</h4>
              <p className="text-sm text-gray-500">
                Your trusted Marketplace and Retailing System. 
                Buy and sell with confidence.
              </p>
            </div>

            {/* Column 2: Explore links */}
            <div>
              <h4 className="text-white font-bold mb-4">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-[#E85D26] transition-colors">Products</Link></li>
                <li><Link href="/categories" className="hover:text-[#E85D26] transition-colors">Categories</Link></li>
              </ul>
            </div>

            {/* Column 3: Company links */}
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-[#E85D26] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#E85D26] transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Column 4: Legal links */}
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-[#E85D26] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#E85D26] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="border-t border-[#1A1A1A] pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 MARS — Marketplace and Retailing System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
