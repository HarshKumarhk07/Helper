import { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle, Scale, Ban, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsAndConditions() {
  const [activeTab, setActiveTab] = useState('general');

  const SECTIONS = [
    {
      id: 'general',
      label: '1. General Terms',
      icon: FileText,
      title: 'Platform Scope & Definitions',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            Welcome to the <strong>Helper</strong> platform (hereinafter referred to as the "Platform"). These Terms & Conditions govern your access to and use of the Platform's website, customer dashboards, professional/worker portal, brand services, and API endpoints.
          </p>
          <p>
            The Platform is owned and operated by <strong>[LEGAL ENTITY NAME]</strong> ("we," "us," or "our"), with registered offices at <strong>[REGISTERED BUSINESS ADDRESS]</strong>. By registering an account, booking a service, listing products, or offering services on the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.
          </p>
          <p>
            These Terms define three primary self-signup roles:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Customer ("user"):</strong> Individuals booking home services or purchasing products.</li>
            <li><strong>Professional ("worker"):</strong> Independent contractors or service providers offering services.</li>
            <li><strong>Brand ("brand"):</strong> Product sellers, companies, or entities listing home supplies and inventory.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'accounts',
      label: '2. Accounts & KYC Verification',
      icon: ShieldCheck,
      title: 'Eligibility, Verification & Role Schemas',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>Age Eligibility:</strong> There is no automated birthdate gating inside the sign-up process. However, to maintain the safety of the platform, we impose a policy requirement that all registering Customers, Professionals, and Brands must be at least <strong>18 years of age</strong> and legally capable of entering into binding contracts.
          </p>
          <p>
            <strong>Registration & Authentication:</strong> Access to dashboards is secured via token-based authentication (JSON Web Tokens). Access and refresh tokens are persisted locally in your browser's localStorage. Passwords are cryptographically hashed using the bcryptjs algorithm prior to database storage.
          </p>
          <p>
            <strong>KYC & Government Verification (Mandatory for Professionals & Brands):</strong>
            To offer services, professionals and brands must submit verification credentials which are reviewed by our administrators. This includes collecting:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Twelve (12) digit Aadhaar Card Number and images of Aadhaar Front/Back.</li>
            <li>Ten (10) character Permanent Account Number (PAN) and PAN Card image.</li>
            <li>Passport photos, selfies, and/or founding team images.</li>
            <li>Official business documentation, including Company Licenses and GST Certificates (where applicable).</li>
          </ul>
          <p>
            All submitted KYC images and legal documents are uploaded directly and securely stored using the <strong>Cloudinary CDN service</strong>. We do not store biometric data or any financial credentials inside our local database. You represent and warrant that all government IDs and selfie uploads submitted are authentic, accurate, and relate solely to you or your registered company.
          </p>
        </div>
      ),
    },
    {
      id: 'bookings',
      label: '3. Bookings, Payments & Wallet',
      icon: CheckCircle,
      title: 'Booking Engine, Razorpay Integration & Wallets',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>Service Bookings:</strong> Customers can book services based on real-time professional availability, target category filters, and location tags. Location parameters are forward-geocoded to coordinate values (latitude/longitude) on a best-effort basis using the open-source <strong>Nominatim OpenStreetMap geocoder</strong>.
          </p>
          <p>
            <strong>Payment Processing via Razorpay:</strong> All online transaction processing is powered by <strong>Razorpay</strong>. Customers pay using Razorpay's client-side widget. 
            <span className="block mt-2 font-semibold text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              ⚠️ PCI-DSS Security Notice: No credit card details, debit card numbers, CVVs, net banking credentials, or bank passwords ever touch, enter, or are stored by our application servers or databases. All credentials go directly to Razorpay's secure payment infrastructure.
            </span>
          </p>
          <p>
            <strong>Platform Wallet:</strong> Customers and professionals are assigned a local platform wallet. Administrators may credit promotional, goodwill, or refund values directly into your wallet. Wallet balances can be used to offset booking costs but cannot be directly cashed out except in accordance with platform policies.
          </p>
        </div>
      ),
    },
    {
      id: 'refunds',
      label: '4. Cancellations & Refunds',
      icon: RefreshCw,
      title: 'Refund Flows & Cancellation Rules',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>Cancellation Rules:</strong> Customers may cancel bookings or orders subject to specific cancellation windows. 
            <span className="block font-semibold text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 my-2">
              ✏️ Business Notice: The standard cancellation policy and timeframe is set to <strong>[DEFINE CANCELLATION/REFUND WINDOW]</strong>. Please review local booking terms before cancelling.
            </span>
          </p>
          <p>
            <strong>Refund Verification & Processing:</strong> Refunds are processed manually or via administrative dashboard triggers. If a refund is approved:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>For online transactions, the system initiates an API call to <strong>Razorpay's refund endpoint</strong> using the captured `razorpayPaymentId`. Razorpay handles the reversal to your original payment method.</li>
            <li>For cash/goodwill transactions, refunds may be credited as standard platform credits directly into the user's local Wallet.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'conduct',
      label: '5. Professional Conduct',
      icon: Ban,
      title: 'Worker Obligations, Reviews & Tracking',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>Status Updates:</strong> Professionals must accurately update their availability status ('free', 'busy', 'offline') to reflect their duty status. While on duty, geographic coordinates may be calculated via Leaflet maps on a best-effort basis for destination tracking.
          </p>
          <p>
            <strong>Independent Contractor Status:</strong> Professionals registering on the platform are independent contractors and not employees of [LEGAL ENTITY NAME]. The platform operates as a marketplace facilitating dispatch matching and supply chain delivery.
          </p>
          <p>
            <strong>User Reviews:</strong> Customers have the right to submit numeric ratings and text reviews for services completed. These reviews trigger automated background tasks to recalculate the rolling `ratingAvg` and `ratingCount` on the worker's user profile schema. Fake, malicious, or abusive reviews will result in immediate account suspension.
          </p>
        </div>
      ),
    },
    {
      id: 'liability',
      label: '6. Limitation of Liability',
      icon: Scale,
      title: 'Disclaimers, Geocoding & Governing Law',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>Map & Geocoding Disclaimer:</strong> Map render outputs (Leaflet) and coordinate results (Nominatim OpenStreetMap) are provided "as-is" without warranty. We are not liable for navigation delays, address lookup misses, or geographical routing discrepancies.
          </p>
          <p>
            <strong>Limitation of Liability:</strong> To the maximum extent permitted by applicable law, <strong>[LEGAL ENTITY NAME]</strong> shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Services performed by independent Professionals in your home.</li>
            <li>Quality of items delivered by third-party Brands.</li>
            <li>Service downtime, server crashes (e.g. database SRV errors), or network failures.</li>
          </ul>
          <p>
            <strong>Governing Law:</strong> These Terms and any disputes arising under them shall be governed by and construed in accordance with the laws of <strong>[GOVERNING LAW / JURISDICTION]</strong>, without regard to conflict of law principles.
          </p>
          <p>
            <strong>Grievances:</strong> For any regulatory or operational complaints, contact our Grievance Officer at <strong>[GRIEVANCE OFFICER CONTACT]</strong> or email us at <strong>[SUPPORT CONTACT EMAIL]</strong>.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-[#FAFBFB] to-[#F1F5F9]" />
      
      <section className="container-velora py-16 md:py-24 animate-fadeIn">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#13294B]/50">
              Legal Agreement
            </span>
          </div>
          <h1 className="font-sans text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-tightest text-[#13294B]">
            Terms & Conditions
          </h1>
          <p className="mt-5 text-sm md:text-base leading-relaxed text-slate-500">
            Please read these terms carefully before using the Helper platform. 
            These rules define your legal rights and operational limits on the platform.
          </p>
        </div>

        {/* Outer Grid */}
        <div className="grid gap-8 lg:grid-cols-[280px_1fr] items-start">
          {/* Side Nav (Desktop only) */}
          <div className="hidden lg:flex flex-col gap-1.5 bg-white border border-slate-100 rounded-2xl p-3.5 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all duration-200 ${
                  activeTab === sec.id
                    ? 'bg-[#E8F5F1] text-[#103D2E] border-l-4 border-[#0F766E]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <sec.icon size={16} className={activeTab === sec.id ? 'text-[#0F766E]' : 'text-slate-400'} />
                <span>{sec.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile selectors */}
          <div className="lg:hidden flex overflow-x-auto gap-2 pb-2.5 scrollbar-thin">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                  activeTab === sec.id
                    ? 'bg-[#13294B] text-white border-[#13294B]'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                <sec.icon size={14} />
                <span>{sec.label.split('.')[1].trim()}</span>
              </button>
            ))}
          </div>

          {/* Content Pane */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(15,23,42,0.02)] animate-fadeIn"
          >
            <h2 className="text-xl md:text-2xl font-bold text-[#13294B] mb-6 flex items-center gap-3 pb-4 border-b border-slate-100">
              {SECTIONS.find((s) => s.id === activeTab)?.title}
            </h2>
            {SECTIONS.find((s) => s.id === activeTab)?.content}
          </motion.div>
        </div>
      </section>
    </>
  );
}
