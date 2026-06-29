import mongoose from 'mongoose';
import SupportTicket, { TICKET_STATUS, TICKET_STATUS_LIST } from '../models/SupportTicket.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Order from '../models/Order.js';
import { ROLES } from '../config/roles.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import {
  notifySupportTicketCreated,
  notifySupportTicketReplied,
} from '../utils/notificationService.js';

const isPrivileged = (role) => role === ROLES.ADMIN;

const populateTicket = (q) =>
  q
    .populate('user', 'name email phone role')
    .populate('assignedAgent', 'name email role')
    .populate({ path: 'booking', select: 'code status amount' })
    .populate({ path: 'order', select: 'orderId status totalAmount' })
    .populate('messages.sender', 'name email role');

const isObjectId = (v) =>
  typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);

const ensureCanRead = (ticket, req) => {
  if (isPrivileged(req.user.role)) return;
  if (String(ticket.user._id || ticket.user) !== String(req.user._id)) {
    throw new ApiError(403, 'Forbidden');
  }
};

export const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, category, priority, bookingId, orderId } = req.body;
  if (!subject || !String(subject).trim()) throw new ApiError(400, 'Subject is required');
  if (!message || !String(message).trim()) throw new ApiError(400, 'Message is required');

  const payload = {
    user: req.user._id,
    subject: String(subject).trim().slice(0, 160),
    category: category || 'other',
    priority: priority || 'normal',
    booking: null,
    order: null,
  };

  if (bookingId && isObjectId(bookingId)) {
    const booking = await Booking.findById(bookingId).select('user');
    if (booking && String(booking.user) === String(req.user._id)) {
      payload.booking = booking._id;
      if (!category) payload.category = 'booking';
    }
  }
  if (orderId && isObjectId(orderId)) {
    const order = await Order.findById(orderId).select('user');
    if (order && String(order.user) === String(req.user._id)) {
      payload.order = order._id;
      if (!category) payload.category = 'order';
    }
  }

  const ticket = await SupportTicket.create({
    ...payload,
    messages: [
      {
        sender: req.user._id,
        senderRole: req.user.role,
        text: String(message).trim().slice(0, 4000),
      },
    ],
    lastActivityAt: new Date(),
    status: TICKET_STATUS.OPEN,
  });

  logAudit({
    req,
    action: 'create_support_ticket',
    resource: 'support_ticket',
    resourceId: ticket._id,
    changes: { code: { from: null, to: ticket.code } },
  });

  notifySupportTicketCreated({ user: req.user, ticket }).catch(() => null);

  const populated = await populateTicket(SupportTicket.findById(ticket._id));
  res.status(201).json({ ticket: populated });
});

export const listMyTickets = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };
  if (status && TICKET_STATUS_LIST.includes(status)) filter.status = status;
  const tickets = await SupportTicket.find(filter)
    .sort({ lastActivityAt: -1 })
    .limit(200)
    .select('code subject status category priority createdAt lastActivityAt messages');
  // Trim messages to count + last preview to keep payload small
  const preview = tickets.map((t) => {
    const last = t.messages?.[t.messages.length - 1];
    return {
      _id: t._id,
      code: t.code,
      subject: t.subject,
      status: t.status,
      category: t.category,
      priority: t.priority,
      createdAt: t.createdAt,
      lastActivityAt: t.lastActivityAt,
      messageCount: t.messages?.length || 0,
      lastMessagePreview: last
        ? { text: last.text.slice(0, 140), at: last.createdAt, fromRole: last.senderRole }
        : null,
    };
  });
  res.json({ tickets: preview });
});

export const listAllTickets = asyncHandler(async (req, res) => {
  const { status, category, q, assignedAgent } = req.query;
  const filter = {};
  if (status && TICKET_STATUS_LIST.includes(status)) filter.status = status;
  if (category) filter.category = category;
  if (assignedAgent && isObjectId(assignedAgent)) filter.assignedAgent = assignedAgent;

  let finalFilter = { ...filter };

  if (q) {
    const code = String(q).toUpperCase();
    finalFilter = {
      ...filter,
      $or: [
        { code: { $regex: code, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
      ],
    };
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const totalRecords = await SupportTicket.countDocuments(finalFilter);
  const totalPages = Math.ceil(totalRecords / limit);

  const tickets = await SupportTicket.find(finalFilter)
    .populate('user', 'name email phone')
    .populate('assignedAgent', 'name email')
    .sort({ lastActivityAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const summarized = tickets.map((t) => {
    const last = t.messages?.[t.messages.length - 1];
    return {
      _id: t._id,
      code: t.code,
      subject: t.subject,
      status: t.status,
      category: t.category,
      priority: t.priority,
      user: t.user,
      assignedAgent: t.assignedAgent,
      createdAt: t.createdAt,
      lastActivityAt: t.lastActivityAt,
      messageCount: t.messages?.length || 0,
      lastMessagePreview: last
        ? { text: last.text.slice(0, 160), at: last.createdAt, fromRole: last.senderRole }
        : null,
    };
  });

  res.json({
    tickets: summarized,
    pagination: {
      page,
      limit,
      skip,
      totalPages,
      totalRecords,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await populateTicket(SupportTicket.findById(req.params.id));
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  ensureCanRead(ticket, req);
  res.json({ ticket });
});

export const addMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !String(text).trim()) throw new ApiError(400, 'Message text required');

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  ensureCanRead(ticket, req);

  if (ticket.status === TICKET_STATUS.CLOSED) {
    throw new ApiError(409, 'Ticket is closed. Please create a new one.');
  }

  const fromAgent = isPrivileged(req.user.role);
  ticket.messages.push({
    sender: req.user._id,
    senderRole: req.user.role,
    text: String(text).trim().slice(0, 4000),
  });
  ticket.lastActivityAt = new Date();

  // Toggle status: agent reply → awaiting_user, user reply → awaiting_agent
  if (fromAgent) {
    ticket.status = TICKET_STATUS.AWAITING_USER;
    if (!ticket.assignedAgent) ticket.assignedAgent = req.user._id;
  } else if (ticket.status === TICKET_STATUS.AWAITING_USER) {
    ticket.status = TICKET_STATUS.AWAITING_AGENT;
  }
  await ticket.save();

  logAudit({
    req,
    action: 'support_ticket_message',
    resource: 'support_ticket',
    resourceId: ticket._id,
    changes: { from: { from: null, to: req.user.role } },
  });

  // Notify the user when an agent replies; notify nothing extra when user replies
  // (admins get the live list update via the dashboard).
  if (fromAgent) {
    const owner = await User.findById(ticket.user);
    if (owner) {
      notifySupportTicketReplied({
        user: owner,
        ticket,
        replyText: text,
        fromAgent: true,
      }).catch(() => null);
    }
  }

  const populated = await populateTicket(SupportTicket.findById(ticket._id));
  res.json({ ticket: populated });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  if (!isPrivileged(req.user.role)) throw new ApiError(403, 'Admin only');
  const { status, assignedAgent } = req.body;
  if (status && !TICKET_STATUS_LIST.includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  const previous = ticket.status;
  if (status) ticket.status = status;
  if (status === TICKET_STATUS.RESOLVED && !ticket.resolvedAt) ticket.resolvedAt = new Date();
  if (status === TICKET_STATUS.CLOSED && !ticket.closedAt) ticket.closedAt = new Date();

  if (assignedAgent !== undefined) {
    if (assignedAgent === null || assignedAgent === '') {
      ticket.assignedAgent = null;
    } else if (isObjectId(assignedAgent) && mongoose.Types.ObjectId.isValid(assignedAgent)) {
      ticket.assignedAgent = assignedAgent;
    }
  }

  ticket.lastActivityAt = new Date();
  await ticket.save();

  logAudit({
    req,
    action: 'support_ticket_status',
    resource: 'support_ticket',
    resourceId: ticket._id,
    changes: { status: { from: previous, to: ticket.status } },
  });

  const populated = await populateTicket(SupportTicket.findById(ticket._id));
  res.json({ ticket: populated });
});
