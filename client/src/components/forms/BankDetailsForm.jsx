import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getBankAccount, createBankAccount, updateBankAccount } from '../../api/bankAccount.js';
import PillButton from '../ui/PillButton.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import { formatDateTime } from '../../lib/format.js';
import { Shield, Lock } from 'lucide-react';

export default function BankDetailsForm() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'Savings',
    upiId: ''
  });

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const data = await getBankAccount();
      if (data) {
        setAccount(data);
        setFormData({
          accountHolderName: data.accountHolderName || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumberMasked || '',
          ifscCode: data.ifscCode || '',
          branchName: data.branchName || '',
          accountType: data.accountType || 'Savings',
          upiId: data.upiIdMasked || ''
        });
      }
    } catch (error) {
      if (error?.response?.status !== 404) {
        toast.error('Failed to load bank account details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.accountHolderName.trim()) return 'Account Holder Name is required.';
    if (!formData.bankName.trim()) return 'Bank Name is required.';
    if (!formData.accountNumber.trim()) return 'Account Number is required.';
    
    const ifscRegex = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
    if (!ifscRegex.test(formData.ifscCode)) return 'Invalid IFSC Code format.';

    if (formData.upiId && !formData.upiId.includes('***')) {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(formData.upiId)) return 'Invalid UPI ID format.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    const confirmSave = window.confirm('Are you sure you want to save these bank details? This may require re-verification.');
    if (!confirmSave) return;

    setSaving(true);
    try {
      // Create payload. If masked values are unchanged, don't send them to prevent validation errors on backend
      const payload = {
        accountHolderName: formData.accountHolderName,
        bankName: formData.bankName,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName,
        accountType: formData.accountType,
      };

      if (!formData.accountNumber.includes('XXXX')) {
        payload.accountNumber = formData.accountNumber;
      }

      if (formData.upiId && !formData.upiId.includes('***')) {
        payload.upiId = formData.upiId;
      } else if (!formData.upiId) {
        payload.upiId = ''; // allow clearing
      }

      if (account) {
        payload.__v = account.__v; // Optimistic locking
        const res = await updateBankAccount(account._id, payload);
        toast.success(res.message);
        setAccount(res.account);
        // Reset masked fields in form data
        setFormData(prev => ({
          ...prev,
          accountNumber: res.account.accountNumberMasked,
          upiId: res.account.upiIdMasked || ''
        }));
      } else {
        const res = await createBankAccount(payload);
        toast.success(res.message);
        setAccount(res.account);
      }
      setIsEditing(false);
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.error('Conflict: This record was modified. Refreshing data...');
        await fetchAccount(); // Auto refresh on conflict
      } else {
        toast.error(error?.response?.data?.message || 'Failed to save bank details.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-64 w-full"></div>;
  }

  const isReadOnly = account && !isEditing;

  return (
    <div className="card-rounded p-5 sm:p-8 bg-paper">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Bank & UPI Details <Shield size={18} className="text-green-600" />
          </h2>
          <p className="text-sm text-ink/60 mt-1">Manage your payout account securely. All sensitive details are encrypted.</p>
        </div>
        {account && !isEditing && (
          <PillButton type="button" onClick={() => setIsEditing(true)}>Edit Details</PillButton>
        )}
        {isEditing && account && (
          <button type="button" className="text-sm font-semibold underline text-ink/60" onClick={() => setIsEditing(false)}>Cancel Edit</button>
        )}
      </div>

      {account && (
        <div className="mb-6 p-4 bg-sand/30 rounded-xl flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Status:</span>
            <StatusBadge status={account.verifiedStatus} />
          </div>
          <div className="text-xs text-ink/50">
            Last updated: {formatDateTime(account.updatedAt)}
          </div>
          {account.verificationNotes && (
             <div className="w-full mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
               Admin Note: {account.verificationNotes}
             </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-xs uppercase font-bold tracking-widest text-ink/70">Account Holder Name</label>
            <input 
              type="text" 
              name="accountHolderName" 
              value={formData.accountHolderName} 
              onChange={handleInputChange} 
              disabled={isReadOnly || saving}
              className="w-full px-4 py-3 bg-sand border-none focus:ring-2 ring-ink rounded-xl disabled:opacity-70 font-medium"
              placeholder="As per bank records"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs uppercase font-bold tracking-widest text-ink/70">Bank Name</label>
            <input 
              type="text" 
              name="bankName" 
              value={formData.bankName} 
              onChange={handleInputChange} 
              disabled={isReadOnly || saving}
              className="w-full px-4 py-3 bg-sand border-none focus:ring-2 ring-ink rounded-xl disabled:opacity-70 font-medium"
              placeholder="e.g. HDFC Bank"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase font-bold tracking-widest text-ink/70 flex items-center justify-between">
              Account Number
              {isReadOnly && <Lock size={12} />}
            </label>
            <input 
              type="text" 
              name="accountNumber" 
              value={formData.accountNumber} 
              onChange={handleInputChange} 
              disabled={isReadOnly || saving}
              className="w-full px-4 py-3 bg-sand border-none focus:ring-2 ring-ink rounded-xl disabled:opacity-70 font-medium"
              placeholder="Enter full account number"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase font-bold tracking-widest text-ink/70">IFSC Code</label>
            <input 
              type="text" 
              name="ifscCode" 
              value={formData.ifscCode} 
              onChange={handleInputChange} 
              disabled={isReadOnly || saving}
              className="w-full px-4 py-3 bg-sand border-none focus:ring-2 ring-ink rounded-xl disabled:opacity-70 font-medium uppercase"
              placeholder="e.g. HDFC0001234"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase font-bold tracking-widest text-ink/70">Branch Name (Optional)</label>
            <input 
              type="text" 
              name="branchName" 
              value={formData.branchName} 
              onChange={handleInputChange} 
              disabled={isReadOnly || saving}
              className="w-full px-4 py-3 bg-sand border-none focus:ring-2 ring-ink rounded-xl disabled:opacity-70 font-medium"
              placeholder="e.g. MG Road Branch"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase font-bold tracking-widest text-ink/70">Account Type</label>
            <select 
              name="accountType"
              value={formData.accountType}
              onChange={handleInputChange}
              disabled={isReadOnly || saving}
              className="w-full px-4 py-3 bg-sand border-none focus:ring-2 ring-ink rounded-xl disabled:opacity-70 font-medium"
            >
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs uppercase font-bold tracking-widest text-ink/70 flex items-center justify-between">
              UPI ID (Optional)
              {isReadOnly && <Lock size={12} />}
            </label>
            <input 
              type="text" 
              name="upiId" 
              value={formData.upiId} 
              onChange={handleInputChange} 
              disabled={isReadOnly || saving}
              className="w-full px-4 py-3 bg-sand border-none focus:ring-2 ring-ink rounded-xl disabled:opacity-70 font-medium"
              placeholder="e.g. 9876543210@ybl"
            />
          </div>
        </div>

        {(!account || isEditing) && (
          <div className="pt-4 border-t border-ink/10 flex justify-end">
            <PillButton type="submit" variant="solid" disabled={saving}>
              {saving ? 'Saving securely...' : (account ? 'Save Changes' : 'Add Bank Details')}
            </PillButton>
          </div>
        )}
      </form>
    </div>
  );
}
