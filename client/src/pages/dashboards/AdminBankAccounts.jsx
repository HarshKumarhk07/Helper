import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, CheckCircle2, AlertTriangle, Clock, XCircle, CreditCard } from 'lucide-react';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { listAdminBankAccounts, adminVerifyBankAccount } from '../../api/bankAccount.js';

export default function AdminBankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    const query = {
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      q: searchQuery,
      page,
      limit: 10,
    };
    listAdminBankAccounts(query)
      .then((res) => {
        setAccounts(res.accounts || []);
        setPagination(res.pagination || null);
      })
      .catch(() => toast.error('Failed to load bank accounts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  useEffect(() => { load(); }, [statusFilter, searchQuery, page]);

  const handleVerify = async (status) => {
    if (!selectedAccount) return;
    if (status === 'rejected' && !verificationNotes.trim()) {
      return toast.error('Please provide a reason for rejection in the notes.');
    }

    setProcessing(true);
    try {
      const payload = {
        verifiedStatus: status,
        verificationNotes,
        verificationMethod: verificationMethod || 'Manual Review'
      };
      await adminVerifyBankAccount(selectedAccount._id, payload);
      toast.success(`Account ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
      setSelectedAccount(null);
      setVerificationNotes('');
      setVerificationMethod('');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to update account status');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (account) => {
    setSelectedAccount(account);
    setVerificationNotes(account.verificationNotes || '');
    setVerificationMethod(account.verificationMethod || '');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'verified':
        return <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-green-700 border border-green-200 gap-1 items-center"><CheckCircle2 size={12}/> Verified</span>;
      case 'rejected':
        return <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-700 border border-red-200 gap-1 items-center"><XCircle size={12}/> Rejected</span>;
      default:
        return <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-800 border border-amber-200 gap-1 items-center"><Clock size={12}/> Pending</span>;
    }
  };

  return (
    <DashboardShell eyebrow="(Finance Module)" title="MANAGE BANK DETAILS.">
      <div className="mb-6 rounded-card border border-ink/10 bg-sand/30 p-4 text-sm text-ink">
        Review and verify worker and brand bank details before approving them for payouts. 
        Always double check IFSC codes and account numbers.
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-ink">
        <div className="flex flex-col gap-4 w-full">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search by User, Name, or Bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-ink/10 bg-paper py-2 pl-10 pr-4 text-sm outline-none focus:border-ink/30 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
          {[
            { label: 'Pending Review', value: 'pending' },
            { label: 'Verified', value: 'verified' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'All Accounts', value: 'all' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 text-xs uppercase tracking-widest rounded border transition ${statusFilter === f.value ? 'bg-ink text-paper border-ink' : 'border-ink/20 text-ink hover:bg-ink/5'}`}
            >
              {f.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="card-rounded overflow-x-auto shadow-sm border border-ink/5 bg-paper">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 border-b border-ink/5">
            <tr>
              <th className="p-4 font-normal">User</th>
              <th className="p-4 font-normal">Account Details</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal">Submitted At</th>
              <th className="p-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan="5" className="p-4">
                    <div className="skeleton h-10 w-full rounded" />
                  </td>
                </tr>
              ))
            ) : accounts.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-ink/50">No bank accounts found matching criteria.</td></tr>
            ) : (
              accounts.map(acc => (
                <tr key={acc._id} className="transition-colors hover:bg-sand/30">
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-ink/5 flex items-center justify-center text-ink/60 font-bold uppercase shrink-0">
                        {acc.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-ink">{acc.user?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-ink/60 line-clamp-1 mt-0.5">{acc.user?.email}</div>
                        <div className="text-[10px] text-ink/40 mt-1 uppercase font-bold tracking-widest">{acc.user?.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <div className="font-semibold text-ink/90 flex items-center gap-1.5"><CreditCard size={14} className="text-ink/50" /> {acc.bankName}</div>
                    <div className="text-xs text-ink/70 mt-1 uppercase tracking-wider">{acc.accountHolderName}</div>
                    <div className="text-[10px] text-ink/50 mt-1.5 font-mono bg-ink/5 inline-block px-1.5 rounded">{acc.accountNumber}</div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    {getStatusBadge(acc.verifiedStatus)}
                  </td>
                  <td className="p-4 align-top pt-5 text-xs text-ink/70">
                    {new Date(acc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-top pt-5 text-right">
                    <button
                      onClick={() => openModal(acc)}
                      className="inline-flex items-center justify-center rounded-full border border-ink/20 bg-sand/30 px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold text-ink hover:bg-ink hover:text-paper transition-colors focus:outline-none"
                    >
                      {acc.verifiedStatus === 'pending' ? 'Review' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4 text-ink">
          <div className="text-xs text-ink/60">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} total records)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage}
              className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium hover:bg-sand/30 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium hover:bg-sand/30 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-8 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-2xl border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4 mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink/60">Verification</div>
                <h3 className="text-2xl font-semibold mt-1">Review Bank Details</h3>
              </div>
              <button onClick={() => setSelectedAccount(null)} className="p-2 bg-ink/5 hover:bg-ink/10 rounded-full transition-colors"><XCircle size={20} className="text-ink/60" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-sand/30 p-4 rounded-xl border border-ink/5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-4">User Information</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-ink/60">Name</div>
                    <div className="font-semibold">{selectedAccount.user?.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">Email</div>
                    <div className="font-semibold">{selectedAccount.user?.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">Role</div>
                    <div className="font-semibold uppercase text-[11px] tracking-wider">{selectedAccount.user?.role}</div>
                  </div>
                </div>
              </div>

              <div className="bg-sand/30 p-4 rounded-xl border border-ink/5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/50 mb-4">Account Details</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-ink/60">Holder Name</div>
                    <div className="font-semibold uppercase">{selectedAccount.accountHolderName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">Bank Name & Branch</div>
                    <div className="font-semibold">{selectedAccount.bankName} {selectedAccount.branchName ? `(${selectedAccount.branchName})` : ''}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">Account Number</div>
                    <div className="font-mono bg-white inline-block px-1 border border-ink/10 mt-0.5 rounded">{selectedAccount.accountNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">IFSC Code</div>
                    <div className="font-mono font-semibold">{selectedAccount.ifscCode}</div>
                  </div>
                  {selectedAccount.upiId && (
                    <div>
                      <div className="text-xs text-ink/60">UPI ID</div>
                      <div className="font-mono">{selectedAccount.upiId}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-ink/10 pt-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink/60 mb-2">Verification Method (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Penny Drop, Passbook Checked"
                  className="w-full rounded-xl border border-ink/20 bg-transparent p-3 text-sm focus:border-ink focus:outline-none"
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink/60 mb-2">Admin Notes</label>
                <textarea
                  placeholder="Add notes (required if rejecting)"
                  className="w-full rounded-xl border border-ink/20 bg-transparent p-3 text-sm focus:border-ink focus:outline-none h-24 resize-none"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4 mt-8 pt-4 border-t border-ink/10">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-ink/50">Current Status:</span>
                {getStatusBadge(selectedAccount.verifiedStatus)}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleVerify('rejected')}
                  disabled={processing}
                  className="rounded-full border border-red-200 bg-red-50 text-red-600 px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleVerify('verified')}
                  disabled={processing || selectedAccount.verifiedStatus === 'verified'}
                  className="rounded-full bg-green-600 text-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-50 shadow-md"
                >
                  {processing ? 'Processing...' : 'Verify Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
