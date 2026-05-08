import mongoose from 'mongoose';

export const TICKET_STATUS = {
  OPEN: 'open',
  AWAITING_USER: 'awaiting_user',
  AWAITING_AGENT: 'awaiting_agent',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const TICKET_STATUS_LIST = Object.values(TICKET_STATUS);

const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const TICKET_CATEGORIES = [
  'booking',
  'order',
  'payment',
  'refund',
  'account',
  'worker',
  'other',
];

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: { type: String, required: true },
    text: { type: String, required: true, maxlength: 4000 },
    attachments: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: { type: String, required: true, maxlength: 160 },
    category: { type: String, enum: TICKET_CATEGORIES, default: 'other', index: true },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'normal' },
    status: {
      type: String,
      enum: TICKET_STATUS_LIST,
      default: TICKET_STATUS.OPEN,
      index: true,
    },

    // Optional links to the entity being asked about
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },

    messages: { type: [messageSchema], default: [] },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const generateCode = () => {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `TX-${ts}${rand}`;
};

supportTicketSchema.pre('validate', function setCode(next) {
  if (!this.code) this.code = generateCode();
  next();
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
