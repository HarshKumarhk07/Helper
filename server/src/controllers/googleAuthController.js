import crypto from 'crypto';
import User from '../models/User.js';
import { ROLES } from '../config/roles.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { logAudit } from '../utils/auditLogger.js';
import { verifyFirebaseIdToken } from '../utils/firebaseAdmin.js';

const buildTokens = (user) => {
  // Carry the user's tokenVersion so logout / password-reset can invalidate
  // Google-issued tokens the same way as email-password ones.
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    tv: user.tokenVersion || 0,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

// POST /api/auth/google { idToken }
//
// Flow:
//   1. Client signs in via Firebase popup → gets an idToken
//   2. Client sends idToken here
//   3. Server verifies it with Firebase Admin SDK
//   4. Server finds user by email or creates one (auto-provision)
//   5. Server issues its own JWT pair (same shape as password login)
//
// Auto-provisioned accounts get the `user` role and a placeholder password
// (random bytes). They sign in with Google going forward; if they ever want
// password login, they use the regular forgot-password flow.
export const googleSignIn = asyncHandler(async (req, res) => {
  const { idToken } = req.body || {};

  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(idToken);
  } catch (err) {
    if (err.code === 'firebase_admin_not_configured') {
      throw new ApiError(
        503,
        'Google sign-in is not enabled on this server. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in server/.env.'
      );
    }
    throw new ApiError(401, 'Google sign-in failed: invalid token');
  }

  const email = String(decoded.email || '').trim().toLowerCase();
  if (!email) {
    throw new ApiError(400, 'Google account has no verified email.');
  }
  if (decoded.email_verified === false) {
    throw new ApiError(403, 'Verify your Google email before signing in.');
  }

  const name = String(decoded.name || '').trim().slice(0, 80) || `Customer ${email.split('@')[0]}`.slice(0, 80);
  const avatar = decoded.picture || '';

  // Find or create the user by email.
  let user = await User.findOne({ email });
  let created = false;
  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString('hex'); // pre-save hashes
    user = await User.create({
      name,
      email,
      password: randomPassword,
      role: ROLES.USER,
      avatar,
    });
    created = true;
  } else {
    // Sync avatar/name on every sign-in (Google is the source of truth here).
    let dirty = false;
    if (avatar && user.avatar !== avatar) {
      user.avatar = avatar;
      dirty = true;
    }
    if (!user.name && name) {
      user.name = name;
      dirty = true;
    }
    if (dirty) await user.save();
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      'Your account is suspended. For further queries connect with support@helper.com'
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = buildTokens(user);

  logAudit({
    req,
    actor: user,
    action: created ? 'google_signup' : 'google_login',
    resource: 'user',
    resourceId: user._id,
    changes: { provider: { from: null, to: 'google' } },
  });

  res.json({ user: user.toSafeJSON(), created, ...tokens });
});
