import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Hourglass,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  User,
  Calendar,
  FileSearch,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import FadeUp from '../../components/ui/FadeUp.jsx';
import { listCarKycSubmissions, reviewCarKyc } from '../../api/carService.js';
import { mediaUrl } from '../../lib/catalogImage.js';
import useAdminSeen from '../../hooks/useAdminSeen.js';

export default function AdminCarKycQueue() {
  useAdminSeen('carKyc');
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [selectedDoc, setSelectedDoc] = useState(null); // URL for modal lightbox preview

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await listCarKycSubmissions(filter);
      setSubmissions(res.data.submissions);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load KYC submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this vehicle KYC?')) return;
    try {
      await reviewCarKyc(id, { status: 'approved' });
      toast.success('KYC Approved.');
      fetchSubmissions();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Failed to approve KYC.');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please enter a rejection reason (mandatory):');
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      toast.error('Rejection reason cannot be blank.');
      return;
    }

    try {
      await reviewCarKyc(id, { status: 'rejected', rejectionReason: reason.trim() });
      toast.success('KYC Rejected.');
      fetchSubmissions();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Failed to reject KYC.');
    }
  };

  const openDocument = (url) => {
    const resolved = mediaUrl(url);
    if (String(url).toLowerCase().endsWith('.pdf')) {
      window.open(resolved, '_blank');
    } else {
      setSelectedDoc(resolved);
    }
  };

  return (
    <DashboardShell eyebrow="Admin Area" title="Car KYC Submissions">
      <FadeUp>
        {/* State Filter tabs */}
        <div className="flex border-b border-ink/10 mb-8 overflow-x-auto shrink-0 scrollbar-none gap-6 text-sm font-semibold">
          {[
            { key: 'pending', label: 'Pending Review' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'border-ink text-ink'
                  : 'border-transparent text-ink/40 hover:text-ink/75'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Hourglass className="h-10 w-10 text-ink/30 animate-spin" />
            <p className="mt-4 text-sm text-ink/60">Loading queue items...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="border border-dashed border-ink/15 rounded-3xl p-16 text-center text-ink/50 bg-sand/5">
            <FileSearch className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No car KYC submissions found.</p>
            <p className="text-xs mt-1">Submissions under the "{filter}" filter will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((sub) => (
              <div
                key={sub._id}
                className="bg-sand/10 border border-ink/10 rounded-3xl p-6 transition-all hover:border-ink/20 hover:shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Professional Info */}
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-ink flex items-center justify-center text-paper shrink-0 overflow-hidden border border-ink/10">
                      {sub.professional?.avatar ? (
                        <img
                          src={mediaUrl(sub.professional.avatar)}
                          alt={sub.professional.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-paper/85" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-ink">{sub.professional?.name || 'Unknown Professional'}</h3>
                      <p className="text-xs text-ink/50 mt-0.5">{sub.professional?.email} | {sub.professional?.phone}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-ink/5 text-ink/80 px-2.5 py-1 rounded-lg border border-ink/10">
                          Car Plate: <span className="font-semibold tracking-wider font-mono">{sub.carNumber}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-ink/75">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>DL Expiry: {new Date(sub.drivingLicenseExpiry).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document previews */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: 'rcDocument', label: 'RC Doc' },
                      { key: 'carPhoto', label: 'Car Photo' },
                      { key: 'drivingLicense', label: 'Driver License' },
                    ].map((doc) => {
                      const fileUrl = sub[doc.key];
                      const isPdf = String(fileUrl).toLowerCase().endsWith('.pdf');

                      return (
                        <button
                          key={doc.key}
                          onClick={() => openDocument(fileUrl)}
                          className="h-10 px-3.5 rounded-xl bg-paper border border-ink/10 hover:border-ink hover:bg-sand/10 transition-all flex items-center gap-1.5 text-xs font-semibold text-ink"
                        >
                          {isPdf ? (
                            <FileText className="h-4 w-4 text-rose-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-blue-500" />
                          )}
                          <span>{doc.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  {sub.status === 'pending' && (
                    <div className="flex gap-2 lg:self-center shrink-0">
                      <button
                        onClick={() => handleApprove(sub._id)}
                        className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(sub._id)}
                        className="h-10 px-5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium text-xs transition-colors flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  )}

                  {sub.status === 'rejected' && sub.rejectionReason && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl max-w-sm text-xs text-rose-950 lg:self-center">
                      <span className="font-semibold block mb-0.5">Rejection Reason:</span>
                      <p className="opacity-90">{sub.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </FadeUp>

      {/* Lightbox Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl bg-paper shadow-2xl p-2 border border-white/10 flex flex-col items-center">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors text-lg font-bold"
            >
              ✕
            </button>
            <img
              src={selectedDoc}
              alt="KYC Document Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
