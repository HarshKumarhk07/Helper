import { BrevoClient } from '@getbrevo/brevo';
import twilio from 'twilio';

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

// Brevo transactional email client. Cached at first use so we don't recreate
// the SDK instance per request. Returns null (not throws) if BREVO_API_KEY
// isn't set — callers degrade gracefully with `{ skipped: true }`.
let brevoClient = null;
let brevoLoggedReady = false;
const getBrevoClient = () => {
  if (brevoClient) return brevoClient;
  const apiKey = process.env.BREVO_API_KEY;
  if (isBlank(apiKey)) return null;
  brevoClient = new BrevoClient({ apiKey });
  if (!brevoLoggedReady) {
    brevoLoggedReady = true;
    console.log('[notification] Brevo transactional email configured');
  }
  return brevoClient;
};

const getSenderIdentity = () => ({
  email: process.env.MAIL_FROM_EMAIL || 'noreply@helper.com',
  name: process.env.MAIL_FROM_NAME || 'Helper',
});

let smsClient = null;
let smsLoggedReady = false;
const getSmsClient = () => {
  if (smsClient) return smsClient;
  const { TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE } = process.env;
  if (isBlank(TWILIO_SID) || isBlank(TWILIO_AUTH_TOKEN) || isBlank(TWILIO_PHONE)) return null;
  if (!TWILIO_SID.startsWith('AC')) return null;
  smsClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
  if (!smsLoggedReady) {
    smsLoggedReady = true;
    console.log(`[notification] Twilio configured (${TWILIO_PHONE})`);
  }
  return smsClient;
};

const e164 = (phone) => {
  if (isBlank(phone)) return null;
  const trimmed = String(phone).trim();
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
};

// Send a transactional email through Brevo. Accepts a single recipient
// address or an array of addresses. Returns `{ skipped }` when the API key
// is missing or the recipient is blank so the calling notify*() flows can
// silently proceed without aborting the user-facing request.
export const sendEmail = async ({ to, subject, html, text }) => {
  if (isBlank(to)) return { skipped: true, reason: 'missing_to' };
  const client = getBrevoClient();
  if (!client) return { skipped: true, reason: 'brevo_not_configured' };

  // Normalize `to` to Brevo's expected shape: [{ email, name? }, ...].
  // Accept string, array of strings, or array of {email,name} objects so
  // existing callers don't need changes.
  const recipients = (Array.isArray(to) ? to : [to])
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') return { email: entry.trim() };
      if (entry.email) return { email: String(entry.email).trim(), ...(entry.name ? { name: entry.name } : {}) };
      return null;
    })
    .filter((r) => r && r.email);

  if (!recipients.length) return { skipped: true, reason: 'missing_to' };

  try {
    const response = await client.transactionalEmails.sendTransacEmail({
      sender: getSenderIdentity(),
      to: recipients,
      subject,
      htmlContent: html,
      textContent: text || stripHtml(html),
    });
    const messageId = response?.messageId || response?.body?.messageId || null;
    console.log(
      `[notification] email sent to ${recipients.map((r) => r.email).join(', ')} (${messageId || 'no-id'}) — ${subject}`
    );
    return { ok: true, id: messageId };
  } catch (err) {
    // Brevo SDK errors surface useful detail on err.body / err.statusCode.
    // Surface both so logs are actionable without leaking the API key.
    const status = err?.statusCode || err?.status || err?.response?.status;
    const body = err?.body || err?.response?.body || err?.response?.data;
    const detail = (body && (body.message || body.code)) || err?.message || 'unknown error';
    console.error(`[notification] Brevo email failed (status=${status || 'n/a'}): ${detail}`);
    return { ok: false, error: detail, status };
  }
};

// Map raw Twilio errors to user-actionable messages.
// Twilio error codes: https://www.twilio.com/docs/api/errors
const friendlyTwilioError = (err) => {
  const code = err?.code;
  const msg = err?.message || '';
  if (code === 21212 || /Invalid From/i.test(msg)) {
    return "Server SMS sender isn't a valid Twilio number. Set TWILIO_PHONE in server/.env to a number you've purchased in your Twilio console.";
  }
  if (code === 21211 || /Invalid 'To'/i.test(msg)) {
    return 'That phone number looks invalid. Check the country code and try again.';
  }
  if (code === 21408 || /not enabled/i.test(msg)) {
    return 'Your Twilio account is not enabled for SMS to this region. Enable the destination country in the Twilio console.';
  }
  if (code === 21610 || /unsubscribed/i.test(msg)) {
    return 'This number has unsubscribed from SMS from your sender. The recipient must reply START to your Twilio number first.';
  }
  if (code === 21608 || /unverified/i.test(msg)) {
    return 'Twilio trial mode: the recipient must be verified in your Twilio console before SMS will be delivered.';
  }
  if (code === 21614 || /not a mobile/i.test(msg)) {
    return 'That number is not a mobile/SMS-capable number.';
  }
  if (code === 20003 || /authenticat/i.test(msg)) {
    return 'Twilio authentication failed. Check TWILIO_SID and TWILIO_AUTH_TOKEN.';
  }
  if (code === 20429 || /rate limit/i.test(msg)) {
    return 'Twilio rate limit reached. Try again in a moment.';
  }
  // Fallback — keep the original message but trim Twilio's marketing prefix.
  return msg.replace(/^.*: /, '') || 'SMS provider rejected the request.';
};

export const sendSMS = async ({ to, body }) => {
  const number = e164(to);
  if (!number) return { skipped: true, reason: 'missing_to' };
  const client = getSmsClient();
  if (!client) return { skipped: true, reason: 'twilio_not_configured' };
  try {
    const msg = await client.messages.create({
      from: process.env.TWILIO_PHONE,
      to: number,
      body,
    });
    return { ok: true, sid: msg.sid };
  } catch (err) {
    const friendly = friendlyTwilioError(err);
    console.error(
      `[notification] sms failed (twilio code=${err?.code || 'n/a'}): ${err.message} → ${friendly}`
    );
    return { ok: false, error: friendly, code: err?.code };
  }
};

const stripHtml = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const wrapEmail = (title, bodyHtml) => `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#faf6ef;color:#1a1a1a;border-radius:14px;overflow:hidden;border:1px solid #e7e1d6;">
    <div style="padding:24px 28px;border-bottom:1px solid #e7e1d6;background:#1a1a1a;color:#faf6ef;">
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7;">Helper</div>
      <div style="font-size:22px;font-weight:600;margin-top:6px;">${title}</div>
    </div>
    <div style="padding:24px 28px;line-height:1.6;font-size:14px;">
      ${bodyHtml}
    </div>
    <div style="padding:18px 28px;font-size:11px;color:#777;border-top:1px solid #e7e1d6;background:#f3eee5;">
      You're receiving this because you have an account with Helper.
    </div>
  </div>
`;

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const fmtAddress = (a) => {
  if (!a) return '';
  return [a.line1, a.line2, a.city, a.state, a.pincode]
    .filter(Boolean)
    .join(', ');
};

export const notifyBookingPlaced = ({ user, booking }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: `Booking confirmed · ${booking.code}`,
      html: wrapEmail(
        'Your booking is confirmed',
        `
        <p>Hi ${user?.name || 'there'},</p>
        <p>We've received your booking. Our team will assign a professional shortly.</p>
        <table style="width:100%;border-collapse:collapse;margin:14px 0;">
          <tr><td style="padding:6px 0;color:#666;">Booking ID</td><td><strong>${booking.code}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666;">Amount</td><td><strong>${inr(booking.amount)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666;">Address</td><td>${fmtAddress(booking.address)}</td></tr>
        </table>
        <p style="margin-top:20px;color:#555;">You'll receive a 6-digit Start PIN once a worker is assigned. Share it with the worker only when they arrive.</p>
        `
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: Booking ${booking.code} confirmed for ${inr(booking.amount)}. We'll assign a worker shortly.`,
    }),
  ]);

export const notifyWorkerAssigned = ({ user, worker, booking, startPin }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: `Worker assigned · ${booking.code}`,
      html: wrapEmail(
        'Your professional is on the way',
        `
        <p>Hi ${user?.name || 'there'},</p>
        <p><strong>${worker?.name || 'A professional'}</strong> has been assigned to your booking.</p>
        <table style="width:100%;border-collapse:collapse;margin:14px 0;">
          <tr><td style="padding:6px 0;color:#666;">Booking</td><td><strong>${booking.code}</strong></td></tr>
          ${worker?.phone ? `<tr><td style="padding:6px 0;color:#666;">Worker phone</td><td>${worker.phone}</td></tr>` : ''}
          ${startPin ? `<tr><td style="padding:6px 0;color:#666;">Start PIN</td><td style="font-size:22px;letter-spacing:6px;"><strong>${startPin}</strong></td></tr>` : ''}
        </table>
        <p style="color:#a33;font-weight:500;">Share the Start PIN with the worker only after they arrive at your location.</p>
        `
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: ${worker?.name || 'A worker'} assigned to ${booking.code}. Start PIN: ${startPin}. Share only on arrival.`,
    }),
    sendSMS({
      to: worker?.phone,
      body: `Helper: New job ${booking.code}. ${fmtAddress(booking.address)}. Ask user for Start PIN on arrival.`,
    }),
  ]);

export const notifyJobStarted = ({ user, booking, endPin }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: `Service started · ${booking.code}`,
      html: wrapEmail(
        'Service started',
        `
        <p>Your service for booking <strong>${booking.code}</strong> has started.</p>
        ${endPin ? `<p>Your <strong>End PIN</strong> is <span style="font-size:22px;letter-spacing:6px;"><strong>${endPin}</strong></span>. Share with the worker once the service is completed to your satisfaction.</p>` : ''}
        `
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: Service ${booking.code} started. End PIN: ${endPin}. Share only after completion.`,
    }),
  ]);

export const notifyJobCompleted = ({ user, booking, invoiceUrl }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: `Service completed · ${booking.code}`,
      html: wrapEmail(
        'Thank you for choosing Helper',
        `
        <p>Your service has been completed.</p>
        <table style="width:100%;border-collapse:collapse;margin:14px 0;">
          <tr><td style="padding:6px 0;color:#666;">Booking</td><td><strong>${booking.code}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666;">Amount</td><td><strong>${inr(booking.amount)}</strong></td></tr>
        </table>
        ${invoiceUrl ? `<p><a href="${invoiceUrl}" style="display:inline-block;padding:10px 18px;background:#1a1a1a;color:#faf6ef;border-radius:8px;text-decoration:none;">Download invoice</a></p>` : ''}
        <p>We'd love your feedback — please rate the service in your account.</p>
        `
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: ${booking.code} completed. ${inr(booking.amount)}. Rate your experience in the app.`,
    }),
  ]);

export const notifyBookingCancelled = ({ user, worker, booking, reason }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: `Booking cancelled · ${booking.code}`,
      html: wrapEmail(
        'Booking cancelled',
        `
        <p>Booking <strong>${booking.code}</strong> has been cancelled.</p>
        ${reason ? `<p style="color:#666;">Reason: ${reason}</p>` : ''}
        ${booking.paymentStatus === 'paid' ? '<p>Any refund eligible will be credited to your original payment method within 5–7 business days.</p>' : ''}
        `
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: Booking ${booking.code} cancelled.${reason ? ' ' + reason : ''}`,
    }),
    worker?.phone
      ? sendSMS({
          to: worker.phone,
          body: `Helper: Booking ${booking.code} cancelled. Job removed from your list.`,
        })
      : Promise.resolve({ skipped: true }),
  ]);

export const notifyKycSubmitted = ({ user }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: 'Verification in progress · Helper',
      html: wrapEmail(
        'Verification form under review',
        `
        <p>Hi ${user?.name || 'there'},</p>
        <p>Thank you for choosing Helper. Your verification form has been received and is currently being reviewed by our team.</p>
        <p>We will review your documents and get back to you very soon.</p>
        `
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: Thank you for choosing us. Your verification form is being reviewed by our team. We will get back to you very soon.`,
    }),
  ]);

export const notifyKycApproved = ({ worker }) => {
  const loginUrl = `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/login`;
  return Promise.allSettled([
    sendEmail({
      to: worker?.email,
      subject: 'Congratulations · Your KYC is approved',
      html: wrapEmail(
        'Congratulations — you are verified!',
        `
        <p>Hi ${worker?.name || 'there'},</p>
        <p>Great news — your KYC has been <strong>approved</strong>. You can now access your worker portal and start receiving job assignments through Helper.</p>
        <p>Simply sign in with the <strong>email and password</strong> you registered with earlier${worker?.email ? ` (<strong>${worker.email}</strong>)` : ''}.</p>
        <p style="margin:20px 0;">
          <a href="${loginUrl}" style="display:inline-block;padding:12px 22px;background:#1a1a1a;color:#faf6ef;border-radius:8px;text-decoration:none;font-weight:600;">Sign in to your portal</a>
        </p>
        <p style="color:#666;">Tip: set your availability once you're in so dispatch can reach you.</p>
        `
      ),
    }),
    sendSMS({
      to: worker?.phone,
      body: `Helper: Congratulations! Your KYC is approved. Sign in with your registered email & password to access your worker portal.`,
    }),
  ]);
};

export const notifyKycRejected = ({ worker, reason }) =>
  Promise.allSettled([
    sendEmail({
      to: worker?.email,
      subject: 'KYC needs attention',
      html: wrapEmail(
        'KYC requires action',
        `
        <p>Hi ${worker?.name || 'there'},</p>
        <p>We were unable to verify your KYC documents.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please log in to the worker app, re-upload the requested documents, and we'll review again within 24 hours.</p>
        `
      ),
    }),
    sendSMS({
      to: worker?.phone,
      body: `Helper: KYC rejected.${reason ? ' Reason: ' + reason : ''} Re-upload documents in the app.`,
    }),
  ]);

export const notifyBrandApproved = ({ brand }) =>
  Promise.allSettled([
    sendEmail({
      to: brand?.email,
      subject: 'Brand account approved · Welcome to Helper',
      html: wrapEmail(
        'Brand account verified',
        `
        <p>Hi ${brand?.name || 'there'},</p>
        <p>Your brand registration and KYC documents have been reviewed and approved. You can now access your seller portal to manage inventory and list products.</p>
        <p style="color:#666;">Make sure to log in to complete your seller profile.</p>
        `
      ),
    }),
    sendSMS({
      to: brand?.phone,
      body: `Helper: Brand account approved. You can now start listing products.`,
    }),
  ]);

export const notifyBrandRejected = ({ brand, reason }) =>
  Promise.allSettled([
    sendEmail({
      to: brand?.email,
      subject: 'Brand verification needs attention',
      html: wrapEmail(
        'Action required: Brand verification',
        `
        <p>Hi ${brand?.name || 'there'},</p>
        <p>We were unable to verify your Brand KYC documents.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please log in, check your dashboard, re-upload the requested documents, and our team will review them again.</p>
        `
      ),
    }),
    sendSMS({
      to: brand?.phone,
      body: `Helper: Brand KYC rejected.${reason ? ' Reason: ' + reason : ''} Re-upload documents in your brand dashboard.`,
    }),
  ]);

export const notifyQuoteRequested = ({ worker, user, booking }) =>
  Promise.allSettled([
    sendEmail({
      to: worker?.email,
      subject: `New quote request · ${booking.code}`,
      html: wrapEmail(
        'You have a new quote request',
        `
        <p>Hi ${worker?.name || 'there'},</p>
        <p>${user?.name || 'A customer'} has requested a price quote for a job.</p>
        ${booking.quoteDetails?.description ? `<p style="color:#555;"><strong>Details:</strong> ${escapeHtml(booking.quoteDetails.description)}</p>` : ''}
        <p>Open your worker app to review and send a quote.</p>
        `
      ),
    }),
    sendSMS({
      to: worker?.phone,
      body: `Helper: New quote request ${booking.code}. Open the app to send your price.`,
    }),
  ]);

export const notifyQuoteSent = ({ user, booking, amount }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: `Your quote is ready · ${booking.code}`,
      html: wrapEmail(
        'A professional has sent you a quote',
        `
        <p>Hi ${user?.name || 'there'},</p>
        <p>You've received a quote of <strong>${inr(amount)}</strong> for booking <strong>${booking.code}</strong>.</p>
        <p>Open the app to accept and pay, or decline.</p>
        `
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: You've received a quote of ${inr(amount)} for ${booking.code}. Open the app to accept or decline.`,
    }),
  ]);

export const notifyOrderPlaced = ({ user, order }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: `Order placed · ${order.code || order._id}`,
      html: wrapEmail(
        'Order received',
        `
        <p>Hi ${user?.name || 'there'},</p>
        <p>We've received your order.</p>
        <table style="width:100%;border-collapse:collapse;margin:14px 0;">
          <tr><td style="padding:6px 0;color:#666;">Order ID</td><td><strong>${order.code || order._id}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666;">Total</td><td><strong>${inr(order.totalAmount || order.total)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666;">Payment</td><td>${order.paymentMode || order.paymentStatus}</td></tr>
        </table>
        `
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: Order ${order.code || order._id} placed for ${inr(order.totalAmount || order.total)}.`,
    }),
  ]);

export const notifyOrderStatus = ({ user, order, status }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: `Order ${status} · ${order.code || order._id}`,
      html: wrapEmail(
        `Order ${status}`,
        `<p>Order <strong>${order.code || order._id}</strong> is now <strong>${status}</strong>.</p>`
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: Order ${order.code || order._id} is now ${status}.`,
    }),
  ]);

export const notifyPasswordReset = ({ user, resetUrl, expiresInMinutes }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: 'Reset your Helper password',
      html: wrapEmail(
        'Password reset requested',
        `
        <p>Hi ${user?.name || 'there'},</p>
        <p>We received a request to reset the password on your Helper account. Click the button below to choose a new password.</p>
        <p style="margin:20px 0;">
          <a href="${resetUrl}" style="display:inline-block;padding:12px 22px;background:#1a1a1a;color:#faf6ef;border-radius:8px;text-decoration:none;font-weight:600;">Reset password</a>
        </p>
        <p style="color:#666;font-size:12px;">This link expires in ${expiresInMinutes} minutes. If you didn't request a reset, you can ignore this email — your password won't change.</p>
        <p style="color:#666;font-size:12px;">If the button doesn't work, paste this URL into your browser:<br/><span style="word-break:break-all;">${resetUrl}</span></p>
        `
      ),
    }),
    sendSMS({
      to: user?.phone,
      body: `Helper: Password reset requested. Open the link in your email — expires in ${expiresInMinutes} min. If this wasn't you, ignore.`,
    }),
  ]);


export const notifySupportTicketCreated = ({ user, ticket }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: `Support ticket received · ${ticket.code}`,
      html: wrapEmail(
        'We received your message',
        `
        <p>Hi ${user?.name || 'there'},</p>
        <p>Thanks for reaching out. We've created ticket <strong>${ticket.code}</strong> for you and our team will reply as soon as possible.</p>
        <table style="width:100%;border-collapse:collapse;margin:14px 0;">
          <tr><td style="padding:6px 0;color:#666;">Subject</td><td><strong>${escapeHtml(ticket.subject)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#666;">Category</td><td>${ticket.category}</td></tr>
          <tr><td style="padding:6px 0;color:#666;">Priority</td><td>${ticket.priority}</td></tr>
        </table>
        <p style="color:#555;">You'll get an email when an agent responds.</p>
        `
      ),
    }),
  ]);

export const notifySupportTicketReplied = ({ user, ticket, replyText, fromAgent }) =>
  Promise.allSettled([
    sendEmail({
      to: user?.email,
      subject: fromAgent
        ? `Reply on your support ticket · ${ticket.code}`
        : `New message on ticket ${ticket.code}`,
      html: wrapEmail(
        fromAgent ? 'We replied to your ticket' : 'Message added',
        `
        <p>Hi ${user?.name || 'there'},</p>
        <p>${fromAgent ? 'A Helper agent has replied' : 'A new message was added'} to ticket <strong>${ticket.code}</strong>.</p>
        <blockquote style="margin:14px 0;padding:12px 16px;border-left:3px solid #1a1a1a;background:#f3eee5;color:#333;">
          ${escapeHtml(replyText).slice(0, 600)}${replyText.length > 600 ? '…' : ''}
        </blockquote>
        <p style="color:#555;">Open the app to read the full thread and reply.</p>
        `
      ),
    }),
    fromAgent
      ? sendSMS({
          to: user?.phone,
          body: `Helper: New reply on support ticket ${ticket.code}. Open the app to view.`,
        })
      : Promise.resolve({ skipped: true }),
  ]);

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const notificationStatus = () => ({
  email: !!getBrevoClient(),
  sms: !!getSmsClient(),
});
