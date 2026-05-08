import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Send as SendIcon, ShieldCheck } from 'lucide-react';
import DashboardShell from './DashboardShell.jsx';
import {
  getTicket,
  addMessage,
  updateTicketStatus,
} from '../../api/support.js';
import { useAuth } from '../../context/AuthContext.jsx';

const STATUS_BADGE = {
  open: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  awaiting_user: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200',
  awaiting_agent:
    'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-300',
  closed: 'bg-ink/10 text-ink/60 dark:bg-paper/10 dark:text-paper/60',
};

const STATUS_LABEL = {
  open: 'Open',
  awaiting_user: 'Awaiting your reply',
  awaiting_agent: 'Awaiting agent',
  resolved: 'Resolved',
  closed: 'Closed',
};

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

export default function SupportThread({ adminMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const bottomRef = useRef(null);

  const isPrivileged = adminMode && (user?.role === 'admin' || user?.role === 'manager');

  const load = () => {
    setLoading(true);
    getTicket(id)
      .then(setTicket)
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Ticket not found');
        navigate(adminMode ? '/admin/support' : '/me/support');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (ticket && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [ticket?.messages?.length]);

  const handleSend = async (e) => {
    e?.preventDefault?.();
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    try {
      const updated = await addMessage(id, text);
      setTicket(updated);
      setReply('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status) => {
    if (!isPrivileged) return;
    setStatusUpdating(true);
    try {
      const updated = await updateTicketStatus(id, { status });
      setTicket(updated);
      toast.success(`Status: ${STATUS_LABEL[status] || status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Status update failed');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading || !ticket) {
    return (
      <DashboardShell eyebrow="Support" title="Ticket">
        <div className="skeleton h-64 w-full" />
      </DashboardShell>
    );
  }

  const meId = String(user?._id || '');
  const closed = ticket.status === 'closed';

  return (
    <DashboardShell
      eyebrow={adminMode ? 'Admin · support' : 'Support'}
      title={ticket.subject}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={() => navigate(adminMode ? '/admin/support' : '/me/support')}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper"
          >
            <ArrowLeft size={12} /> Back to tickets
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono uppercase tracking-widest text-ink/60 dark:text-paper/50">
              {ticket.code}
            </span>
            <span
              className={`rounded-full px-3 py-1 font-medium uppercase tracking-widest ${
                STATUS_BADGE[ticket.status] || ''
              }`}
            >
              {STATUS_LABEL[ticket.status] || ticket.status}
            </span>
            <span className="text-ink/50 dark:text-paper/40">
              · {ticket.category} · {ticket.priority}
            </span>
            {adminMode && ticket.user && (
              <span className="text-ink/60 dark:text-paper/50">
                · From <strong>{ticket.user.name}</strong> ({ticket.user.email})
              </span>
            )}
          </div>
        </div>
        {isPrivileged && (
          <div className="flex flex-wrap gap-2">
            {ticket.status !== 'resolved' && (
              <button
                onClick={() => handleStatus('resolved')}
                disabled={statusUpdating}
                className="rounded-full border border-green-400 px-4 py-1.5 text-xs uppercase tracking-widest text-green-700 hover:bg-green-50 disabled:opacity-50 dark:border-green-400/30 dark:text-green-300 dark:hover:bg-green-400/10"
              >
                Mark resolved
              </button>
            )}
            {ticket.status !== 'closed' && (
              <button
                onClick={() => handleStatus('closed')}
                disabled={statusUpdating}
                className="rounded-full border border-ink/30 px-4 py-1.5 text-xs uppercase tracking-widest hover:bg-ink hover:text-paper disabled:opacity-50 dark:border-paper/30"
              >
                Close
              </button>
            )}
            {ticket.status === 'closed' && (
              <button
                onClick={() => handleStatus('open')}
                disabled={statusUpdating}
                className="rounded-full border border-ink/30 px-4 py-1.5 text-xs uppercase tracking-widest hover:bg-ink hover:text-paper disabled:opacity-50 dark:border-paper/30"
              >
                Reopen
              </button>
            )}
          </div>
        )}
      </div>

      {(ticket.booking || ticket.order) && (
        <div className="card-rounded mb-5 p-4 text-sm">
          <div className="text-xs uppercase tracking-widest text-ink/60 dark:text-paper/50">
            Linked
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ticket.booking && (
              <div>
                <span className="text-ink/60 dark:text-paper/50">Booking</span>{' '}
                <span className="font-mono">{ticket.booking.code}</span>{' '}
                <span className="text-ink/60 dark:text-paper/50">
                  · {ticket.booking.status} · ₹{ticket.booking.amount}
                </span>
              </div>
            )}
            {ticket.order && (
              <div>
                <span className="text-ink/60 dark:text-paper/50">Order</span>{' '}
                <span className="font-mono">{ticket.order.orderId}</span>{' '}
                <span className="text-ink/60 dark:text-paper/50">
                  · {ticket.order.status} · ₹{ticket.order.totalAmount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card-rounded p-5">
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-2">
          {ticket.messages.map((m) => {
            const mine = String(m.sender?._id || m.sender) === meId;
            const isAgent =
              m.senderRole === 'admin' || m.senderRole === 'manager';
            return (
              <div
                key={m._id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    mine
                      ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                      : 'border border-ink/10 bg-sand/40 text-ink dark:border-paper/10 dark:bg-paper/5 dark:text-paper'
                  }`}
                >
                  <div
                    className={`mb-1 flex items-center gap-1 text-[10px] uppercase tracking-widest ${
                      mine ? 'opacity-70' : 'text-ink/50 dark:text-paper/40'
                    }`}
                  >
                    {isAgent && <ShieldCheck size={10} />}
                    {m.sender?.name || (mine ? 'You' : m.senderRole)}
                    <span className="ml-2 normal-case tracking-normal opacity-70">
                      {fmt(m.createdAt)}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {!closed ? (
          <form onSubmit={handleSend} className="mt-5 border-t border-ink/10 pt-4 dark:border-paper/10">
            <textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={isPrivileged ? 'Reply to the customer…' : 'Type your reply…'}
              className="w-full rounded-xl border border-ink/15 bg-transparent p-3 text-sm focus:border-ink focus:outline-none dark:border-paper/15 dark:focus:border-paper/60"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-ink/50 dark:text-paper/40">
                {reply.length}/4000
              </span>
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs uppercase tracking-widest text-paper transition hover:opacity-90 disabled:opacity-50 dark:bg-paper dark:text-ink"
              >
                {sending ? 'Sending…' : <><SendIcon size={12} /> Send</>}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 rounded-xl border border-ink/10 bg-sand/40 p-4 text-center text-sm text-ink/60 dark:border-paper/10 dark:bg-paper/5 dark:text-paper/50">
            This ticket is closed. {isPrivileged ? 'Reopen it to keep replying.' : 'Please create a new ticket if you need more help.'}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
