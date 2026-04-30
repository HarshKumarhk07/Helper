import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listUsers, adminCreateUser, setUserActive } from '../../api/users.js';
import FadeUp from '../../components/ui/FadeUp.jsx';
import DashboardShell from './DashboardShell.jsx';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'worker', phone: '' });

  const load = () => {
    setLoading(true);
    listUsers(roleFilter !== 'all' ? { role: roleFilter } : {})
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [roleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminCreateUser(newUser);
      toast.success('User created successfully');
      setShowForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'worker', phone: '' });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to create user');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await setUserActive(id, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'suspended'}`);
      load();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <DashboardShell eyebrow="(RBAC Module)" title="MANAGE PERSONNEL.">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-2">
          {['all', 'user', 'worker', 'manager'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 text-xs uppercase tracking-widest rounded border transition ${roleFilter === role ? 'bg-ink text-paper border-ink dark:bg-paper dark:text-ink' : 'border-ink/20 text-ink/60 hover:bg-ink/5 dark:border-paper/20 dark:text-paper/60'}`}
            >
              {role}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="pill-btn-solid text-sm">
          {showForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>

      {showForm && (
        <FadeUp>
          <form onSubmit={handleCreate} className="card-rounded p-6 mb-8 bg-sand/30">
            <h3 className="text-xl font-bold mb-4">CREATE NEW PERSONNEL</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input required placeholder="Full Name" className="p-3 border rounded-xl" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
              <input required type="email" placeholder="Email Address" className="p-3 border rounded-xl" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
              <input required placeholder="Phone Number" className="p-3 border rounded-xl" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} />
              <input required type="password" placeholder="Password" className="p-3 border rounded-xl" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
              <select className="p-3 border rounded-xl" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
                <option value="worker">Worker</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="pill-btn-solid">Create Account</button>
          </form>
        </FadeUp>
      )}

      <div className="card-rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60 dark:bg-[#18181A] dark:text-paper/60">
            <tr>
              <th className="p-4 font-normal">Name</th>
              <th className="p-4 font-normal">Email</th>
              <th className="p-4 font-normal">Role</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
            {loading ? (
              <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center">No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u._id} className="transition hover:bg-sand/30 dark:hover:bg-[#18181A]/50">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-ink/70 dark:text-paper/70">{u.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-ink/5 dark:bg-paper/5 rounded text-xs tracking-widest uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-600"><ShieldCheck size={14}/> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600"><ShieldAlert size={14}/> Suspended</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggleActive(u._id, u.isActive)}
                      className="text-xs tracking-widest uppercase hover:underline"
                    >
                      {u.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
