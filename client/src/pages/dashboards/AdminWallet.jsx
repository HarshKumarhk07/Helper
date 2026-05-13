import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Wallet,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Snowflake,
  Sun,
  CreditCard,
} from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import {
  getUserWallet,
  adminCreditWallet,
  adminDebitWallet,
  adminToggleFreeze,
} from '../../api/wallet.js';
import { listUsers } from '../../api/users.js';

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

export default function AdminWallet() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const [showCredit, setShowCredit] = useState(false);
  const [showDebit, setShowDebit] = useState(false);
  const [form, setForm] = useState({ amount: '', note: '' });
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    listUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoadingUsers(false));
  }, []);

  const filteredUsers = useMemo(() => {
    if (!q.trim()) return users.slice(0, 100);
    const needle = q.toLowerCase();
    return users
      .filter(
        (u) =>
          u.name?.toLowerCase().includes(needle) ||
          u.email?.toLowerCase().includes(needle) ||
          u.phone?.toLowerCase().includes(needle)
      )
      .slice(0, 100);
  }, [users, q]);

  const loadWallet = (userId) => {
    if (!userId) return;
    setLoadingWallet(true);
    getUserWallet(userId)
      .then(setWalletData)
      .catch(() => toast.error('Failed to load wallet'))
      .finally(() => setLoadingWallet(false));
  };

  const handleSelect = (user) => {
    setSelectedUserId(user._id);
    setShowCredit(false);
    setShowDebit(false);
    setForm({ amount: '', note: '' });
    loadWallet(user._id);
  };

  const handleSubmit = async (kind) => {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a positive amount');
      return;
    }
    setWorking(true);
    try {
      const fn = kind === 'credit' ? adminCreditWallet : adminDebitWallet;
      await fn(selectedUserId, { amount, note: form.note });
      toast.success(`${kind === 'credit' ? 'Credited' : 'Debited'} ${inr(amount)}`);
      setShowCredit(false);
      setShowDebit(false);
      setForm({ amount: '', note: '' });
      loadWallet(selectedUserId);
    } catch (err) {
      toast.error(err?.response?.data?.message || `${kind} failed`);
    } finally {
      setWorking(false);
    }
  };

  const handleFreezeToggle = async () => {
    if (!walletData) return;
    setWorking(true);
    try {
      const updated = await adminToggleFreeze(
        selectedUserId,
        !walletData.wallet.isFrozen
      );
      toast.success(updated.isFrozen ? 'Wallet frozen' : 'Wallet unfrozen');
      loadWallet(selectedUserId);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Toggle failed');
    } finally {
      setWorking(false);
    }
  };

  return (
    <DashboardShell eyebrow="Operations" title="User wallets">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="card-rounded flex flex-col p-4">
          <div className="mb-3 flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-3 py-2">
            <Search size={14} className="text-ink/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40:text-paper/40"
            />
          </div>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {loadingUsers ? (
              <div className="p-4 text-center text-sm text-ink/60">
                Loading…
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-ink/60">
                No users found.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const active = u._id === selectedUserId;
                return (
                  <button
                    key={u._id}
                    onClick={() => handleSelect(u)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                      active
                        ? 'bg-ink text-paper'
                        : 'hover:bg-sand/40:bg-paper/5'
                    }`}
                  >
                    <div className="font-medium">{u.name}</div>
                    <div
                      className={`text-xs ${
                        active ? 'opacity-70' : 'text-ink/55'
                      }`}
                    >
                      {u.email}
                      {u.phone ? ` · ${u.phone}` : ''}
                    </div>
                    <div
                      className={`mt-1 text-[10px] uppercase tracking-widest ${
                        active ? 'opacity-70' : 'text-ink/45'
                      }`}
                    >
                      {u.role}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div>
          {!selectedUserId ? (
            <div className="card-rounded p-12 text-center text-sm text-ink/60">
              <Wallet size={32} className="mx-auto mb-3 opacity-40" />
              Select a user from the left to view and manage their wallet.
            </div>
          ) : loadingWallet || !walletData ? (
            <div className="skeleton h-64 w-full" />
          ) : (
            <div className="space-y-6">
              <div className="card-rounded p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-ink/60">
                      Wallet for
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {walletData.user.name}
                    </div>
                    <div className="text-xs text-ink/60">
                      {walletData.user.email} · {walletData.user.phone || 'no phone'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-widest text-ink/60">
                      Balance
                    </div>
                    <div className="mt-1 text-3xl font-bold sm:text-4xl">
                      {inr(walletData.wallet.balance)}
                    </div>
                    {walletData.wallet.isFrozen && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs uppercase tracking-widest text-red-700">
                        <Snowflake size={11} /> Frozen
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setShowCredit(true);
                      setShowDebit(false);
                      setForm({ amount: '', note: '' });
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-xs uppercase tracking-widest text-white hover:bg-green-700"
                  >
                    <ArrowDownCircle size={13} /> Credit
                  </button>
                  <button
                    onClick={() => {
                      setShowDebit(true);
                      setShowCredit(false);
                      setForm({ amount: '', note: '' });
                    }}
                    disabled={walletData.wallet.balance <= 0}
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <ArrowUpCircle size={13} /> Debit
                  </button>
                  <button
                    onClick={handleFreezeToggle}
                    disabled={working}
                    className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest hover:border-ink/40:border-paper/40"
                  >
                    {walletData.wallet.isFrozen ? (
                      <>
                        <Sun size={13} /> Unfreeze
                      </>
                    ) : (
                      <>
                        <Snowflake size={13} /> Freeze
                      </>
                    )}
                  </button>
                </div>

                {(showCredit || showDebit) && (
                  <div className="mt-5 rounded-2xl border border-ink/10 p-4">
                    <div className="text-xs uppercase tracking-widest text-ink/60">
                      {showCredit ? 'Credit wallet' : 'Debit wallet'}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        placeholder="Amount in ₹"
                        className="rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none:border-paper/60"
                      />
                      <input
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="Note (visible to user)"
                        className="rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none:border-paper/60"
                      />
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowCredit(false);
                          setShowDebit(false);
                        }}
                        className="rounded-full border border-ink/15 px-4 py-2 text-xs uppercase tracking-widest hover:border-ink/40:border-paper/40"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmit(showCredit ? 'credit' : 'debit')}
                        disabled={working || !form.amount}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs uppercase tracking-widest text-white disabled:opacity-50 ${
                          showCredit
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        <CreditCard size={13} />
                        {working
                          ? 'Working…'
                          : `Confirm ${showCredit ? 'credit' : 'debit'}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-rounded overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sand/50 text-xs uppercase tracking-widest text-ink/60">
                    <tr>
                      <th className="p-4 font-normal">When</th>
                      <th className="p-4 font-normal">Type</th>
                      <th className="p-4 font-normal">Source</th>
                      <th className="p-4 font-normal text-right">Amount</th>
                      <th className="p-4 font-normal text-right">Balance after</th>
                      <th className="p-4 font-normal">By</th>
                      <th className="p-4 font-normal">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {walletData.transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-6 text-center text-ink/60"
                        >
                          No transactions yet.
                        </td>
                      </tr>
                    ) : (
                      walletData.transactions.map((t) => (
                        <tr
                          key={t._id}
                          className="transition hover:bg-sand/30:bg-[#18181A]/50"
                        >
                          <td className="p-4 text-xs text-ink/70">
                            {fmt(t.createdAt)}
                          </td>
                          <td className="p-4 text-xs uppercase tracking-widest">
                            {t.type}
                          </td>
                          <td className="p-4 text-xs uppercase tracking-widest">
                            {t.source}
                          </td>
                          <td
                            className={`p-4 text-right font-semibold tabular-nums ${
                              t.type === 'credit'
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}
                          >
                            {t.type === 'credit' ? '+' : '−'}
                            {inr(t.amount)}
                          </td>
                          <td className="p-4 text-right tabular-nums">
                            {inr(t.balanceAfter)}
                          </td>
                          <td className="p-4 text-xs">
                            {t.performedBy?.name || '—'}
                          </td>
                          <td className="p-4 text-xs text-ink/65">
                            {t.note || <span className="opacity-50">—</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
