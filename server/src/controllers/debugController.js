import { sendEmail, notificationStatus } from '../utils/notificationService.js';

const requireToken = (req) => {
  const token = process.env.DEBUG_NOTIFICATION_TOKEN;
  if (!token) return false;
  const header = req.get('x-debug-token') || req.query.token;
  return header === token;
};

export const getNotificationStatus = (req, res) => {
  if (process.env.NODE_ENV === 'production' && !requireToken(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  return res.json({ ok: true, status: notificationStatus() });
};

export const postSendTestEmail = async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !requireToken(req)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const to = req.body.to || process.env.MAIL_FROM_EMAIL;
  const subject = req.body.subject || 'Test email from Helper';
  const html = req.body.html || '<p>This is a test email from Helper.</p>';
  const result = await sendEmail({ to, subject, html });
  return res.json({ ok: true, result });
};

export default { getNotificationStatus, postSendTestEmail };
