'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Privacy <span className="text-[#E85D26]">Policy</span>
        </h1>

        <div className="space-y-6 text-gray-400 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
            <p>
              When you register for MARS, we collect your name, email address, phone number,
              and shipping addresses. We also store order history and cart data to provide
              a seamless shopping experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h2>
            <p>
              Your information is used to process orders, manage your account, and communicate
              order updates. We do not sell or share your personal data with third parties
              for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Data Security</h2>
            <p>
              All passwords are hashed using bcrypt before storage. Authentication uses
              JSON Web Tokens (JWT) with expiration. We follow industry-standard practices
              to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data
              at any time by contacting us. You can also update your profile information
              directly from your account settings.
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
