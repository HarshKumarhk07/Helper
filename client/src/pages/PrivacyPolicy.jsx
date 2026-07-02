import { useState } from 'react';
import { ShieldCheck, Eye, Database, Share2, Trash2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  const [activeTab, setActiveTab] = useState('collection');

  const SECTIONS = [
    {
      id: 'collection',
      label: '1. What We Collect',
      icon: Eye,
      title: 'Data Collection & Schema Declarations',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            We collect personal information necessary to facilitate booking dispatches and supply deliveries. The following categories of data are actively collected and stored:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Core Account Fields:</strong> Your full name, email address, phone number, role choice (Customer, Professional, or Brand), and avatar image.</li>
            <li><strong>Authentication Credentials:</strong> Passwords are cryptographically hashed using the <code>bcryptjs</code> algorithm before saving in the database; we never store plain-text passwords.</li>
            <li><strong>Address & Geolocation Details:</strong> We collect address lines (street, city, state, pin code, landmark) and coordinates (latitude and longitude) to coordinate route assignments. Geolocation parameters are calculated on a best-effort basis.</li>
            <li><strong>KYC Verification Materials (Mandatory for Workers & Brands):</strong> To perform verification checks, we collect government identifiers (Aadhaar Number, PAN Number) and physical documents (Aadhaar Front/Back images, PAN Card photos, selfies, business licenses, GST certificates).</li>
          </ul>
          <p className="font-semibold text-slate-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
            🔒 Sensitive Personal Data Rule: We do NOT collect or store biometric details, medical records, or raw banking/credit card numbers on our servers.
          </p>
        </div>
      ),
    },
    {
      id: 'storage',
      label: '2. Storage & Infrastructure',
      icon: Database,
      title: 'Where & How Your Data is Stored',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            Your data is hosted and managed across the following secure environments:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Database Storage:</strong> Profile configurations, service logs, orders, and booking records are stored in our secure database instance.</li>
            <li><strong>Cloud Storage (CDN):</strong> All uploaded photos, document files, brand catalog pictures, and KYC credentials are uploaded directly to and hosted by <strong>Cloudinary</strong>.</li>
            <li><strong>Browser Storage:</strong> To maintain active session states and user preferences without tracking cookies, we persist data in your browser's <code>localStorage</code>. This includes authentication JWTs (access and refresh tokens), cart contents, favorite items, selected locations, and theme configurations.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'processors',
      label: '3. Third-Party Processors',
      icon: Share2,
      title: 'Third-Party Data Shared & API Integrations',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            To process bookings, payments, and system notifications, we send specific metadata to verified third-party services. The integrations include:
          </p>
          <ul className="list-disc pl-5 space-y-3">
            <li>
              <strong>Razorpay (Payment Gateway):</strong> Verification signatures and order values are shared to facilitate checkouts. 
              <span className="block text-xs text-slate-500 mt-1 italic">
                * Note: Your card and bank account numbers are handled directly by Razorpay's client-side widget. We never receive or store these details.
              </span>
            </li>
            <li>
              <strong>Twilio (SMS Alerts):</strong> Transactional dispatch status notifications are sent to your mobile phone number via Twilio SMS APIs.
            </li>
            <li>
              <strong>Brevo (Email Dispatcher):</strong> Automated system alerts, bookings, and receipt emails are processed by the Brevo transactional email engine.
            </li>
            <li>
              <strong>Firebase Admin SDK (Auth Provider):</strong> If you choose Google Authentication to log in, your Google profile ID token is verified via Firebase to authenticate your session.
            </li>
            <li>
              <strong>Nominatim OpenStreetMap:</strong> Freeform address queries are shared to resolve latitude and longitude coordinates.
            </li>
            <li>
              <strong>Cloudinary (Asset Hosting):</strong> Uploaded user documents, photos, and verification proofs are sent to Cloudinary for cloud CDN storage.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'rights',
      label: '4. User Rights & Deletion',
      icon: Trash2,
      title: 'Data Deletion Policies & Account Controls',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>Self-Service Limits:</strong> There is no automated, self-service "delete account" button built directly inside the user dashboard screens. 
          </p>
          <p>
            <strong>Account Suspension:</strong> Platform administrators have the authority to suspend or activate account records (using the <code>setUserActive</code> database controller) in case of code-of-conduct violations or review disputes.
          </p>
          <p>
            <strong>Data Deletion Requests:</strong> If you wish to permanently deactivate or delete your account records, please contact our support team at <strong>[SUPPORT CONTACT EMAIL]</strong>. We will review your request and manually remove or anonymize your data from our database within standard administrative timelines, subject to regulatory retention mandates (such as tax audit records and active financial transactions).
          </p>
        </div>
      ),
    },
    {
      id: 'cookies',
      label: '5. Cookies & Tracking',
      icon: ShieldCheck,
      title: 'Tracking Disclaimer & Cookie Usage',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>No Tracking Cookies:</strong> The Platform does NOT use tracking cookies, behavioral pixel scripts, or marketing analytics trackers (such as Google Analytics or Facebook Pixel) to log your activity across third-party sites.
          </p>
          <p>
            <strong>Operational LocalStorage:</strong> We use local storage space (<code>localStorage</code>) on your terminal device strictly for necessary website operations:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Storing your session access token and refresh token (JWT).</li>
            <li>Remembering your cart items and favorites lists.</li>
            <li>Remembering your selected city location filters.</li>
            <li>Maintaining user-defined light/dark UI themes.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'compliance',
      label: '6. Compliance & Contacts',
      icon: Mail,
      title: 'Compliance Assertions & Contacts',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            <strong>Operational Measures:</strong> We implement industry-standard database access restrictions, hashed passwords, and token-based API locks to protect your details.
          </p>
          <p>
            <strong>Business placeholders:</strong>
            For privacy queries, data access requests, or grievance escalations, please contact:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Legal Entity:</strong> [LEGAL ENTITY NAME]</li>
            <li><strong>Registered Address:</strong> [REGISTERED BUSINESS ADDRESS]</li>
            <li><strong>Data Grievance Officer:</strong> [GRIEVANCE OFFICER CONTACT]</li>
            <li><strong>Support Email:</strong> [SUPPORT CONTACT EMAIL]</li>
            <li><strong>Governing Law Jurisdiction:</strong> [GOVERNING LAW / JURISDICTION]</li>
          </ul>
          <p className="text-xs text-slate-400 mt-6 italic">
            Disclaimer: This Privacy Policy documents actual codebase data collection behaviors. Please review with legal counsel to ensure compliance with relevant local statutes (such as DPDP Act, GDPR, or CCPA) depending on your target markets.
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
              Information Integrity
            </span>
          </div>
          <h1 className="font-sans text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-tightest text-[#13294B]">
            Privacy Policy
          </h1>
          <p className="mt-5 text-sm md:text-base leading-relaxed text-slate-500">
            This policy outlines how your data is collected, shared, and stored on our platform. 
            All declarations here are verifiably accurate to our codebase operations.
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
