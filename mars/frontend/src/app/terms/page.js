'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Terms of <span className="text-[#E85D26]">Service</span>
        </h1>

        <div className="space-y-6 text-gray-400 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using the MARS platform, you agree to these
              terms of service. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account
              credentials. Each account must be associated with a valid email address.
              Users may register as Customers or Sellers. Admin accounts are created
              by existing administrators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Seller Responsibilities</h2>
            <p>
              Sellers are responsible for the accuracy of their product listings,
              including descriptions, prices, and stock quantities. Sellers must fulfill
              orders in a timely manner and maintain honest communication with buyers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Purchases and Orders</h2>
            <p>
              All orders are subject to product availability. Prices are displayed in
              USD. Once an order is placed, stock is automatically decremented. Order
              status progresses through: Pending → Processing → Shipped → Delivered.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Limitation of Liability</h2>
            <p>
              MARS is provided &quot;as is&quot; without warranties of any kind. This is an
              educational project and does not process real payments or shipments.
            </p>
          </section>

          <p className="text-gray-600 mt-8 text-xs">
            Last updated: March 2026. This is a student project and not a real commercial platform.
          </p>
        </div>
      </div>
    </div>
  );
}
