import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listMyAddresses, createAddress, deleteAddress } from '../../api/addresses.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import PillButton from '../../components/ui/PillButton.jsx';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function UserAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, addressId: null, addressLabel: '' });
  const [newAddress, setNewAddress] = useState({
    label: 'home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  const load = () => {
    setLoading(true);
    listMyAddresses()
      .then(setAddresses)
      .catch(() => toast.error('Failed to load addresses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAddress(newAddress);
      toast.success('Address saved!');
      setShowForm(false);
      setNewAddress({ label: 'home', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save address');
    }
  };

  const handleDelete = async (id, label) => {
    setDeleteModal({ show: true, addressId: id, addressLabel: label });
  };

  const confirmDelete = async () => {
    try {
      await deleteAddress(deleteModal.addressId);
      toast.success('Address deleted');
      setDeleteModal({ show: false, addressId: null, addressLabel: '' });
      load();
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  return (
    <section className="container-velora py-12 md:py-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50 mb-3">
            (My addresses)
          </div>
          <h1 className="heading-display text-4xl md:text-6xl">SAVED PLACES.</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="pill-btn-solid text-sm"
        >
          {showForm ? 'Cancel' : 'Add New'}
        </button>
      </div>

      {showForm && (
        <FadeUp>
          <form onSubmit={handleCreate} className="card-rounded p-6 mb-8 bg-sand/30">
            <h3 className="heading-display text-xl mb-4">NEW ADDRESS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select 
                value={newAddress.label} 
                onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
              <input required placeholder="Line 1" className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none" value={newAddress.line1} onChange={(e) => setNewAddress({...newAddress, line1: e.target.value})} />
              <input placeholder="Line 2 (Optional)" className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none" value={newAddress.line2} onChange={(e) => setNewAddress({...newAddress, line2: e.target.value})} />
              <input required placeholder="City" className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none" value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} />
              <input required placeholder="State" className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none" value={newAddress.state} onChange={(e) => setNewAddress({...newAddress, state: e.target.value})} />
              <input required placeholder="Pincode" className="p-3 border border-ink/20 rounded-xl bg-transparent focus:border-ink outline-none" value={newAddress.pincode} onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})} />
            </div>
            <label className="flex items-center gap-2 mb-6">
              <input type="checkbox" checked={newAddress.isDefault} onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})} />
              <span className="text-sm">Set as default</span>
            </label>
            <button type="submit" className="pill-btn-solid">Save Address</button>
          </form>
        </FadeUp>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton h-40 w-full" />)
        ) : addresses.length === 0 ? (
          <div className="col-span-full rounded-card border border-ink/10 bg-sand/40 p-10 text-center text-sm dark:border-paper/10">
            No saved addresses found.
          </div>
        ) : (
          addresses.map((addr, i) => (
            <FadeUp key={addr._id} delay={i * 0.05}>
              <div className="card-rounded p-5 relative">
                {addr.isDefault && (
                  <span className="absolute top-4 right-4 text-[10px] uppercase bg-ink text-paper px-2 py-1 rounded-full tracking-widest">
                    Default
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3 text-ink/50 dark:text-paper/50 uppercase tracking-widest text-xs">
                  {addr.label}
                </div>
                <div className="font-bold mb-1">{addr.line1}</div>
                {addr.line2 && <div className="text-sm text-ink/80 dark:text-paper/80 mb-1">{addr.line2}</div>}
                <div className="text-sm text-ink/80 dark:text-paper/80">{addr.city}, {addr.state} {addr.pincode}</div>
                
                <div className="mt-6 pt-4 border-t border-ink/10 dark:border-paper/10 flex justify-end">
                  <button onClick={() => handleDelete(addr._id, addr.label)} className="text-red-500 hover:text-red-700 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </FadeUp>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-sm border border-paper/10 bg-paper p-8 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:border-paper/20 dark:bg-[#14151A] dark:text-paper">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-400/10">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-center mb-2">Delete Address</h3>
            <p className="text-center text-ink/70 dark:text-paper/70 mb-6">
              Are you sure you want to delete your <strong className="text-red-600 dark:text-red-400 capitalize">{deleteModal.addressLabel}</strong> address? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, addressId: null, addressLabel: '' })}
                className="flex-1 px-4 py-3 rounded-xl border border-ink/20 dark:border-paper/20 hover:bg-ink/5 dark:hover:bg-paper/5 transition font-medium uppercase tracking-widest text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium uppercase tracking-widest text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
