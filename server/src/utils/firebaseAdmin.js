// Firebase Admin SDK — used to verify Google ID tokens issued via the
// Firebase popup on the client.
//
// The user provides a Service Account from Firebase console:
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY  (multiline; \n must be preserved)
//
// If any of those are blank, the SDK isn't initialized and verification
// returns a clean error so the caller can respond with a helpful message.
import admin from 'firebase-admin';

let initializedApp = null;
let initError = null;

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

const getOrInitApp = () => {
  if (initializedApp) return initializedApp;
  if (initError) return null; // already failed once

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (isBlank(FIREBASE_PROJECT_ID) || isBlank(FIREBASE_CLIENT_EMAIL) || isBlank(FIREBASE_PRIVATE_KEY)) {
    initError = new Error('firebase_admin_not_configured');
    return null;
  }

  try {
    // Heroku-style env vars often contain literal \n which we need to convert.
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    initializedApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
    console.log(`[firebase] admin initialized for project ${FIREBASE_PROJECT_ID}`);
    return initializedApp;
  } catch (err) {
    initError = err;
    console.error('[firebase] init failed:', err.message);
    return null;
  }
};

export const isFirebaseConfigured = () => !!getOrInitApp();

// Verify a Firebase ID token (issued by the client SDK after Google popup).
// Returns the decoded token { uid, email, name, picture, email_verified, ... }
// or throws an Error with `code` set to 'firebase_admin_not_configured' or 'invalid_token'.
export const verifyFirebaseIdToken = async (idToken) => {
  const app = getOrInitApp();
  if (!app) {
    const err = new Error('Firebase Admin is not configured on the server.');
    err.code = 'firebase_admin_not_configured';
    throw err;
  }
  if (!idToken || typeof idToken !== 'string') {
    const err = new Error('Missing ID token.');
    err.code = 'invalid_token';
    throw err;
  }
  try {
    const decoded = await admin.auth(app).verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    const wrapped = new Error(err?.message || 'Invalid ID token');
    wrapped.code = 'invalid_token';
    throw wrapped;
  }
};
