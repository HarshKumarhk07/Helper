import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowLeft } from 'lucide-react';

export default function ProfileEdit() {
  const { user: currentUser, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    aadhaarNumber: '',
    panNumber: '',
    passportPhoto: '',
  });
  const [kycStatus, setKycStatus] = useState('pending');

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        aadhaarNumber: currentUser.aadhaarNumber || '',
        panNumber: currentUser.panNumber || '',
        passportPhoto: currentUser.passportPhoto || currentUser.avatar || '',
      });
      setKycStatus(currentUser.kycStatus || 'pending');
    }
  }, [currentUser]);

  const uploadPassportPhoto = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.patch('/users/me', form);
      setUser(response.data.user);
      toast.success('Profile updated successfully');
      navigate(-1);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-[#0B0C0F] text-ink dark:text-paper">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-ink/5 dark:hover:bg-paper/5 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Edit My Profile</h1>
            <p className="text-ink/60 dark:text-paper/60 text-sm mt-1">Update your personal and KYC details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-sand/20 dark:bg-paper/5 rounded-2xl border border-ink/10 dark:border-paper/10 p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4 uppercase tracking-widest text-ink/70 dark:text-paper/70">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                placeholder="Full Name"
                className="p-3 border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20 focus:outline-none focus:border-ink dark:focus:border-paper"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                placeholder="Phone Number"
                className="p-3 border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20 focus:outline-none focus:border-ink dark:focus:border-paper"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          {/* KYC Documents */}
          <div>
            <h2 className="text-lg font-semibold mb-4 uppercase tracking-widest text-ink/70 dark:text-paper/70">
              KYC Documents
            </h2>
            <div className="space-y-4">
              {/* Passport Photo */}
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-widest text-ink/60 dark:text-paper/60">
                  Passport Photo URL
                </label>
                <input
                  placeholder="https://example.com/passport-photo.jpg"
                  className="w-full p-3 border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20 focus:outline-none focus:border-ink dark:focus:border-paper"
                  value={form.passportPhoto}
                  onChange={(e) => setForm({ ...form, passportPhoto: e.target.value })}
                />
              </div>

              {/* File Upload */}
              <div className="rounded-xl border border-dashed border-ink/20 dark:border-paper/20 bg-transparent p-4">
                <div className="mb-2 text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">Or choose from computer</div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-ink/70 file:mr-4 file:rounded-pill file:border-0 file:bg-ink file:px-4 file:py-2 file:text-paper dark:text-paper/70 dark:file:bg-paper dark:file:text-ink"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadPassportPhoto(file);
                        setForm((current) => ({ ...current, passportPhoto: url }));
                        toast.success('Passport photo uploaded');
                      } catch {
                        toast.error('Failed to upload passport photo');
                      }
                    }}
                  />
                  {form.passportPhoto && (
                    <img
                      src={form.passportPhoto}
                      alt="Passport photo preview"
                      className="h-16 w-16 rounded-xl object-cover border border-ink/10"
                    />
                  )}
                </div>
              </div>

              {/* Aadhaar & PAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-widest text-ink/60 dark:text-paper/60">
                    Aadhaar Number (12 digits)
                  </label>
                  <input
                    placeholder="123456789012"
                    inputMode="numeric"
                    maxLength={12}
                    className="w-full p-3 border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20 focus:outline-none focus:border-ink dark:focus:border-paper"
                    value={form.aadhaarNumber}
                    onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-widest text-ink/60 dark:text-paper/60">
                    PAN Number (format: AAAAA0000A)
                  </label>
                  <input
                    placeholder="AAAAA0000A"
                    maxLength={10}
                    className="w-full p-3 border rounded-xl bg-white dark:bg-paper/10 text-ink dark:text-paper border-ink/20 dark:border-paper/20 focus:outline-none focus:border-ink dark:focus:border-paper uppercase"
                    value={form.panNumber}
                    onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase().slice(0, 10) })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KYC Status (Read-only) */}
          <div>
            <h2 className="text-lg font-semibold mb-4 uppercase tracking-widest text-ink/70 dark:text-paper/70">
              KYC Status
            </h2>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-paper/10 border border-ink/10 dark:border-paper/10">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${
                  kycStatus === 'verified'
                    ? 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300'
                    : kycStatus === 'rejected'
                      ? 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200'
                }`}
              >
                {kycStatus === 'verified' ? '✓ Verified' : kycStatus === 'rejected' ? '✗ Rejected' : '⊙ Pending Review'}
              </span>
              <p className="text-sm text-ink/60 dark:text-paper/60">
                {kycStatus === 'pending'
                  ? 'Your KYC documents are awaiting admin review.'
                  : kycStatus === 'verified'
                    ? 'Your identity has been verified. You can accept bookings.'
                    : 'Your KYC was rejected. Please contact support.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 rounded-xl border border-ink/20 dark:border-paper/20 hover:bg-ink/5 dark:hover:bg-paper/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-ink text-paper dark:bg-paper dark:text-ink rounded-xl font-medium uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-400/10 border border-blue-200 dark:border-blue-400/20">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Note:</strong> After you submit your KYC details, an admin will review and verify your information. Your KYC status will be updated once the review is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
