import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { listUsers, adminCreateUser, updateUser, setUserActive, deleteUser } from '../../api/users.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { ShieldAlert, ShieldCheck, Search, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import useAdminSeen from '../../hooks/useAdminSeen.js';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker',
    phone: '',
    aadhaarNumber: '',
    panNumber: '',
    passportPhoto: '',
    kycStatus: 'pending',
    companyName: '',
    companyAddress: '',
    businessType: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    aadhaarNumber: '',
    panNumber: '',
    passportPhoto: '',
    kycStatus: 'pending',
    password: '',
    role: 'worker',
    isActive: true,
    companyName: '',
    companyAddress: '',
    businessType: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Clears the dashboard "Users | roles" badge on open; previous visit time is
  // used to flag newly-registered customers as NEW.
  const previousSeen = useAdminSeen('users');
  const isNew = (u) =>
    previousSeen && u.role === 'user' && u.createdAt && new Date(u.createdAt) > previousSeen;

  const load = () => {
    setLoading(true);
    const query = {
      ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
      q: searchQuery,
      page,
      limit: 10,
    };
    listUsers(query)
      .then((res) => {
        setUsers(res.users || []);
        setPagination(res.pagination || null);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [roleFilter, searchQuery]);

  useEffect(() => { load(); }, [roleFilter, searchQuery, page]);

  const openEditor = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      aadhaarNumber: user.aadhaarNumber || '',
      panNumber: user.panNumber || '',
      passportPhoto: user.passportPhoto || user.avatar || '',
      kycStatus: user.kycStatus || 'pending',
      password: '',
      role: user.role || 'worker',
      isActive: !!user.isActive,
      companyName: user.companyName || '',
      companyAddress: user.companyAddress || '',
      businessType: user.businessType || '',
    });
  };

  const closeEditor = () => {
    setEditingUser(null);
    setEditForm({
      name: '',
      email: '',
      phone: '',
      aadhaarNumber: '',
      panNumber: '',
      passportPhoto: '',
      kycStatus: 'pending',
      password: '',
      role: 'worker',
      isActive: true,
      companyName: '',
      companyAddress: '',
      businessType: '',
    });
  };

  const uploadPassportPhoto = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminCreateUser(newUser);
      toast.success('User created successfully');
      setShowForm(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'worker',
        phone: '',
        aadhaarNumber: '',
        panNumber: '',
        passportPhoto: '',
        kycStatus: 'pending',
        companyName: '',
        companyAddress: '',
        businessType: '',
      });
      load();
    } catch (err) {
      const resp = err?.response?.data;
      if (resp?.details) {
        // show field details if provided
        const first = Array.isArray(resp.details) ? resp.details.map(d => d.message).join('; ') : resp.details;
        toast.error(first || resp?.error || 'Failed to create user');
      } else {
        toast.error(resp?.error || 'Failed to create user');
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    const isSelf = currentUser?._id === id;
    if (isSelf && currentStatus) {
      toast.error("You can't suspend your own account");
      return;
    }

    try {
      await setUserActive(id, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'suspended'}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (user) => {
    const isSelf = currentUser?._id === user._id;
    if (isSelf) {
      toast.error("You can't delete your own account");
      return;
    }

    const ok = window.confirm(`Are you sure you want to delete the user "${user.name || ''}" (${user.email})? This action cannot be undone and will notify them via email.`);
    if (!ok) return;

    try {
      await deleteUser(user._id);
      toast.success('User deleted successfully');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload = {
        ...editForm,
        password: editForm.password.trim(),
      };

      if (!payload.password) delete payload.password;

      const updated = await updateUser(editingUser._id, payload);
      setUsers((current) => current.map((user) => (user._id === updated._id ? updated : user)));
      toast.success('User updated successfully');
      closeEditor();
    } catch (err) {
      const resp = err?.response?.data;
      if (resp?.details) {
        const first = Array.isArray(resp.details) ? resp.details.map(d => d.message).join('; ') : resp.details;
        toast.error(first || resp?.error || 'Failed to update user');
      } else {
        toast.error(resp?.error || 'Failed to update user');
      }
    }
  };

  return (
    <DashboardShell eyebrow="(RBAC Module)" title="MANAGE PERSONNEL.">
      <div className="mb-6 rounded-card border border-ink/10 bg-sand/30 p-4 text-sm text-ink">
        Approve worker accounts, review KYC details such as Aadhaar and PAN, assign workers or
        managers, and keep user records editable from this panel.
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-ink">
        <div className="flex flex-col gap-4">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search by Name or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-ink/10 bg-paper py-2 pl-10 pr-4 text-sm outline-none focus:border-ink/30 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
          {[
            { label: 'All Users', value: 'all' },
            { label: 'Customer', value: 'user' },
            { label: 'Worker', value: 'worker' },
            { label: 'Brand/Company', value: 'brand' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={`px-3 py-1 text-xs uppercase tracking-widest rounded border transition ${roleFilter === f.value ? 'bg-ink text-paper border-ink' : 'border-ink/20 text-ink hover:bg-ink/5'}`}
            >
              {f.label}
            </button>
          ))}
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="pill-btn-solid text-sm">
          {showForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>

      {showForm && (
        <FadeUp>
          <form onSubmit={handleCreate} className="card-rounded p-6 mb-8 bg-sand/30">
            <h3 className="text-xl font-bold mb-4 text-ink">CREATE NEW PERSONNEL</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input required placeholder="Full Name" className="p-3 border rounded-xl bg-white text-ink placeholder-ink/40 border-ink/20 focus:outline-none focus:border-ink:border-paper/60" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
              <input required type="email" placeholder="Email Address" className="p-3 border rounded-xl bg-white text-ink placeholder-ink/40 border-ink/20 focus:outline-none focus:border-ink:border-paper/60" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
              <input required placeholder="Phone Number" className="p-3 border rounded-xl bg-white text-ink placeholder-ink/40 border-ink/20 focus:outline-none focus:border-ink:border-paper/60" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} />
              <input required type="password" placeholder="Password" className="p-3 border rounded-xl bg-white text-ink placeholder-ink/40 border-ink/20 focus:outline-none focus:border-ink:border-paper/60" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
              
              {newUser.role !== 'brand' ? (
                <>
                  <input placeholder="Aadhaar Number" inputMode="numeric" maxLength={12} className="p-3 border rounded-xl bg-white text-ink placeholder-ink/40 border-ink/20 focus:outline-none focus:border-ink:border-paper/60" value={newUser.aadhaarNumber} onChange={(e) => setNewUser({...newUser, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12)})} />
                  <input placeholder="PAN Number" maxLength={10} className="p-3 border rounded-xl bg-white text-ink placeholder-ink/40 border-ink/20 focus:outline-none focus:border-ink:border-paper/60 uppercase" value={newUser.panNumber} onChange={(e) => setNewUser({...newUser, panNumber: e.target.value.toUpperCase().slice(0, 10)})} />
                </>
              ) : (
                <>
                  <input required placeholder="Company Name" className="p-3 border rounded-xl bg-white text-ink placeholder-ink/40 border-ink/20 focus:outline-none focus:border-ink:border-paper/60" value={newUser.companyName} onChange={(e) => setNewUser({...newUser, companyName: e.target.value})} />
                  <input required placeholder="Business Type" className="p-3 border rounded-xl bg-white text-ink placeholder-ink/40 border-ink/20 focus:outline-none focus:border-ink:border-paper/60" value={newUser.businessType} onChange={(e) => setNewUser({...newUser, businessType: e.target.value})} />
                  <input required placeholder="Company Address" className="p-3 border rounded-xl bg-white text-ink placeholder-ink/40 border-ink/20 focus:outline-none focus:border-ink:border-paper/60 md:col-span-2" value={newUser.companyAddress} onChange={(e) => setNewUser({...newUser, companyAddress: e.target.value})} />
                </>
              )}

              <div className="md:col-span-2 rounded-xl border border-dashed border-ink/20 bg-white p-4">
                <div className="mb-2 text-xs uppercase tracking-widest text-ink">Passport size photo</div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-ink file:mr-4 file:rounded-full file:border file:border-ink/15 file:bg-paper file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-sand"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadPassportPhoto(file);
                        setNewUser((current) => ({ ...current, passportPhoto: url }));
                        toast.success('Passport photo uploaded');
                      } catch {
                        toast.error('Failed to upload passport photo');
                      }
                    }}
                  />
                  {newUser.passportPhoto && (
                    <img src={newUser.passportPhoto} alt="Passport photo preview" className="h-16 w-16 rounded-xl object-cover border border-ink/10" />
                  )}
                </div>
              </div>
              <select className="p-3 border rounded-xl bg-white text-ink border-ink/20 focus:outline-none focus:border-ink:border-paper/60" value={newUser.kycStatus} onChange={(e) => setNewUser({...newUser, kycStatus: e.target.value})}>
                <option value="pending">KYC Pending</option>
                <option value="verified">KYC Verified</option>
                <option value="rejected">KYC Rejected</option>
                <option value="not required">KYC Not Required</option>
              </select>
              <select className="p-3 border rounded-xl bg-white text-ink border-ink/20 focus:outline-none focus:border-ink:border-paper/60" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
                <option value="worker">Worker</option>
                <option value="user">Customer</option>
                <option value="brand">Brand/Company</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="pill-btn-solid">Create Account</button>
          </form>
        </FadeUp>
      )}

      <div className="card-rounded overflow-x-auto shadow-sm border border-ink/5 bg-paper">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 border-b border-ink/5">
            <tr>
              <th className="p-4 font-normal">User</th>
              <th className="p-4 font-normal">Role</th>
              <th className="p-4 font-normal">KYC Status</th>
              <th className="p-4 font-normal">Account Status</th>
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
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-ink/50">No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u._id} className={`transition-colors hover:bg-sand/30 group ${isNew(u) ? 'bg-amber-50/50' : ''}`}>
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-ink/5 flex items-center justify-center text-ink/60 font-bold uppercase shrink-0">
                        {u.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-ink flex items-center gap-2">
                          {u.name}
                          {isNew(u) && (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                              New
                            </span>
                          )}
                          {u.isFeatured && (
                            <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-ink flex items-center gap-1">
                              <Star size={10} className="fill-ink text-ink" /> Featured
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink/60 line-clamp-1 mt-0.5">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <span className="px-2 py-1 bg-ink/5 rounded text-[10px] font-bold tracking-widest uppercase text-ink/80 border border-ink/5">
                      {u.role === 'user' ? 'Customer' : u.role === 'brand' ? 'Brand/Company' : u.role}
                    </span>
                  </td>
                  <td className="p-4 align-top pt-5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${u.kycStatus === 'verified' ? 'bg-green-100 text-green-700 border-green-200' : u.kycStatus === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : u.kycStatus === 'not required' ? 'bg-ink/5 text-ink/60 border-ink/10' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                      {u.kycStatus || 'pending'}
                    </span>
                  </td>
                  <td className="p-4 align-top pt-5">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-medium"><ShieldCheck size={14}/> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-red-600 text-xs font-medium"><ShieldAlert size={14}/> Suspended</span>
                    )}
                  </td>
                  <td className="p-4 align-top pt-5 text-right">
                    <button
                      onClick={() => openEditor(u)}
                      className="inline-flex items-center justify-center rounded-full border border-ink/20 bg-sand/30 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-ink hover:bg-ink hover:text-paper transition-colors focus:outline-none"
                    >
                      Manage
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

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-8 backdrop-blur-sm">
          <div className="card-rounded w-full max-w-3xl border border-paper/10 bg-paper p-6 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.35)] max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink">Edit user</div>
                <h3 className="heading-display mt-2 text-2xl text-ink">{editingUser.name}</h3>
                <p className="mt-1 text-sm text-ink">Update worker or user details and KYC information.</p>
              </div>
              <button onClick={closeEditor} className="pill-btn text-xs">Close</button>
            </div>

            <form onSubmit={handleUpdateUser} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input required placeholder="Full Name" className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink placeholder-ink/45" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <input required type="email" placeholder="Email Address" className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink placeholder-ink/45" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              <input placeholder="Phone Number" className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink placeholder-ink/45" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              {editForm.role !== 'brand' ? (
                <>
                  <input placeholder="Aadhaar Number" inputMode="numeric" maxLength={12} className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink placeholder-ink/45" value={editForm.aadhaarNumber} onChange={(e) => setEditForm({ ...editForm, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })} />
                  <input placeholder="PAN Number" maxLength={10} className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink placeholder-ink/45 uppercase" value={editForm.panNumber} onChange={(e) => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase().slice(0, 10) })} />
                </>
              ) : (
                <>
                  <input required placeholder="Company Name" className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink placeholder-ink/45" value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} />
                  <input required placeholder="Business Type" className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink placeholder-ink/45" value={editForm.businessType} onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })} />
                  <input required placeholder="Company Address" className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink placeholder-ink/45 md:col-span-2" value={editForm.companyAddress} onChange={(e) => setEditForm({ ...editForm, companyAddress: e.target.value })} />
                </>
              )}

              <div className="md:col-span-2 rounded-xl border border-dashed border-ink/20 bg-transparent p-4">
                <div className="mb-2 text-xs uppercase tracking-widest text-ink">Passport size photo</div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-ink file:mr-4 file:rounded-full file:border file:border-ink/15 file:bg-paper file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-sand"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadPassportPhoto(file);
                        setEditForm((current) => ({ ...current, passportPhoto: url }));
                        toast.success('Passport photo uploaded');
                      } catch {
                        toast.error('Failed to upload passport photo');
                      }
                    }}
                  />
                  {editForm.passportPhoto && (
                    <img src={editForm.passportPhoto} alt="Passport photo preview" className="h-16 w-16 rounded-xl object-cover border border-ink/10" />
                  )}
                </div>
              </div>
              <select className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink" value={editForm.kycStatus} onChange={(e) => setEditForm({ ...editForm, kycStatus: e.target.value })}>
                <option value="pending">KYC Pending</option>
                <option value="verified">KYC Verified</option>
                <option value="rejected">KYC Rejected</option>
                <option value="not required">KYC Not Required</option>
              </select>
              <select className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="worker">Worker</option>
                <option value="user">Customer</option>
                <option value="brand">Brand/Company</option>
                <option value="admin">Admin</option>
              </select>
              <input type="password" placeholder="New Password (optional)" className="p-3 border rounded-xl bg-transparent border-ink/20 text-ink placeholder-ink/45 md:col-span-2" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-ink md:col-span-2">
                <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
                Active account
              </label>
              <div className="md:col-span-2 flex flex-wrap justify-between items-center gap-4 mt-6 border-t border-ink/10 pt-6">
                <div>
                  {currentUser?._id !== editingUser._id && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteUser(editingUser);
                        closeEditor();
                      }}
                      className="text-xs uppercase tracking-widest font-bold text-red-600 hover:text-red-700 hover:underline px-2"
                    >
                      Delete Account
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeEditor} className="pill-btn">Cancel</button>
                  <button type="submit" className="pill-btn-solid">Save changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
