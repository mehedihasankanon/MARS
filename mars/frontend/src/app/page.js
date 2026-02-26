'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-white dark:bg-gray-950">
      {/* HERO SECTION */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to <span className="text-blue-600 dark:text-blue-400">MARS</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Your ultimate marketplace and retailing system. 
            Buy and sell products with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
            <Link 
              href="/auth/register"
              className="px-8 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-semibold rounded-lg border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Why Choose MARS?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Wide Selection</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Browse thousands of products from trusted sellers across multiple categories.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Secure & Safe</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your transactions are protected with industry-leading security and buyer protection.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Fast Shipping</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Quick delivery with real-time tracking on all your orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 dark:bg-blue-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied buyers and sellers on MARS today.
          </p>
          <Link 
            href="/auth/register"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Create an Account
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">MARS</h4>
              <p className="text-sm">Your trusted marketplace and retailing system.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-white transition">Products</Link></li>
                <li><Link href="/categories" className="hover:text-white transition">Categories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 MARS - Marketplace and Retailing System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
