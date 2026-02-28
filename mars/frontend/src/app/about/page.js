'use client';

/**
 * ABOUT PAGE — /about
 * Simple informational page about the MARS platform.
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">
          About <span className="text-[#E85D26]">MARS</span>
        </h1>
        <p className="text-gray-400 mb-8 text-lg">
          Marketplace and Retailing System
        </p>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <p>
            MARS is a full-stack e-commerce platform that connects buyers and sellers
            in a seamless, modern marketplace. Built as a database management systems
            project, it demonstrates real-world application of relational database design,
            user authentication, role-based access control, and responsive web interfaces.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Key Features</h2>
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <span className="text-[#E85D26] mt-1">&#x2022;</span>
              <span><strong className="text-gray-200">Multi-role system</strong> — Customers browse and buy, Sellers list and manage products, Admins oversee the entire platform.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#E85D26] mt-1">&#x2022;</span>
              <span><strong className="text-gray-200">Full shopping flow</strong> — Product browsing, cart management, checkout with address entry, and order tracking.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#E85D26] mt-1">&#x2022;</span>
              <span><strong className="text-gray-200">Secure authentication</strong> — JWT-based auth with bcrypt password hashing and role-based route protection.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#E85D26] mt-1">&#x2022;</span>
              <span><strong className="text-gray-200">PostgreSQL database</strong> — 23-table normalized schema covering users, products, orders, shipments, reviews, and more.</span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Tech Stack</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Frontend', value: 'Next.js + React + Tailwind CSS' },
              { label: 'Backend', value: 'Express.js (Node.js)' },
              { label: 'Database', value: 'PostgreSQL' },
              { label: 'Auth', value: 'JWT + bcrypt' },
            ].map((item) => (
              <div key={item.label} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-white text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
