'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="bg-[#0A0A0A]">

      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#1A0E05] via-[#0A0A0A] to-[#0A0A0A] overflow-hidden">

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E85D26] rounded-full opacity-[0.04] blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          <div className="flex justify-center mb-8">
            <Image
              src="/mars-logo.png"
              alt="MARS — Marketplace and Retailing System logo"
              width={220}
              height={250}
              priority  
              className="drop-shadow-[0_0_30px_rgba(232,93,38,0.3)]"
            />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            {' '}
            <span className="mars-text-gradient">MARS</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your ultimate <span className="text-[#E85D26] font-semibold">Marketplace and Retailing System</span>. 
            Buy and sell products with confidence across the universe.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products"
              className="px-8 py-3.5 bg-[#E85D26] text-white font-semibold rounded-lg hover:bg-[#D14F1E] transition-all duration-200 shadow-lg shadow-[#E85D26]/20 hover:shadow-[#E85D26]/40 text-lg"
            >
              Browse Products
            </Link>
            <Link 
              href={user ? "/profile" : "/auth/register"}
              className="px-8 py-3.5 bg-transparent text-[#E85D26] font-semibold rounded-lg border-2 border-[#E85D26] hover:bg-[#E85D26]/10 transition-all duration-200 text-lg"
            >
              {user ? "My Account" : "Start Selling"}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            Why Choose <span className="text-[#E85D26]">MARS</span>?
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Everything you need for a seamless shopping experience
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">

            <div className="p-8 bg-[#111111] rounded-xl border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#E85D26]/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-[#E85D26]/20 transition-colors">
                Shop
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Wide Selection</h3>
              <p className="text-gray-400 leading-relaxed">
                Browse thousands of products from trusted sellers across multiple categories.
              </p>
            </div>

            <div className="p-8 bg-[#111111] rounded-xl border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#E85D26]/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-[#E85D26]/20 transition-colors">
                Lock
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Secure & Safe</h3>
              <p className="text-gray-400 leading-relaxed">
                Your transactions are protected with industry-leading security and buyer protection.
              </p>
            </div>

            <div className="p-8 bg-[#111111] rounded-xl border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#E85D26]/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-[#E85D26]/20 transition-colors">
                Ship
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Fast Shipping</h3>
              <p className="text-gray-400 leading-relaxed">
                Quick delivery with real-time tracking on all your orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            How It <span className="text-[#E85D26]">Works</span>
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Getting started is easy — just three simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-[#E85D26] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-5">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Browse & Discover</h3>
              <p className="text-gray-400">
                Explore products across categories. Use search and filters to find what you need.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-[#E85D26] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-5">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Add to Cart</h3>
              <p className="text-gray-400">
                Select your items and add them to your shopping cart. Adjust quantities anytime.
              </p>
            </div>

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

      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#E85D26] to-[#F59E0B] opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+PC9zdmc+')] opacity-30" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {user ? "Welcome back!" : "Ready to get started?"}
          </h2>
          <p className="text-xl text-white/80 mb-8">
            {user ? "Explore new products and great deals on MARS." : "Join thousands of satisfied buyers and sellers on MARS today."}
          </p>
          <Link 
            href={user ? "/products" : "/auth/register"}
            className="inline-block px-10 py-4 bg-[#0A0A0A] text-[#E85D26] font-bold rounded-lg hover:bg-[#111111] transition-all duration-200 text-lg shadow-2xl"
          >
            {user ? "Browse Products" : "Create an Account"}
          </Link>
        </div>
      </section>

      <footer className="bg-[#050505] text-gray-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto">

          <div className="grid md:grid-cols-4 gap-8 mb-8">
            
            <div>
              <h4 className="text-[#E85D26] font-bold text-lg mb-4">MARS</h4>
              <p className="text-sm text-gray-500">
                Your trusted Marketplace and Retailing System. 
                Buy and sell with confidence.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-[#E85D26] transition-colors">Products</Link></li>
                <li><Link href="/categories" className="hover:text-[#E85D26] transition-colors">Categories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-[#E85D26] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#E85D26] transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-[#E85D26] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#E85D26] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#1A1A1A] pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 MARS — Marketplace and Retailing System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
