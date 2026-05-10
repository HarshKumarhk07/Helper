// Firebase initialization — lazy-loaded so we never crash the app when env
// vars are missing (e.g., on a fresh checkout). The first time `getFirebaseAuth`
// is called we either return an initialized auth instance or throw a clean
// error that the calling button can surface as a friendly message.
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigComplete = () =>
  Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

export const isFirebaseConfigured = isConfigComplete;

let cachedAuth = null;

export const getFirebaseAuth = () => {
  if (!isConfigComplete()) {
    const err = new Error('firebase_not_configured');
    err.userMessage =
      'Google sign-in is not configured for this app. Add VITE_FIREBASE_* keys to client/.env and restart.';
    throw err;
  }
  if (cachedAuth) return cachedAuth;
  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  // Persist Firebase session in localStorage so users aren't kicked out on refresh.
  setPersistence(auth, browserLocalPersistence).catch(() => {
    /* fallback to whatever default — non-fatal */
  });
  cachedAuth = auth;
  return auth;
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Pops the Google sign-in window and returns the Firebase ID token. Throws a
// well-tagged Error so the UI can map provider errors to friendly text.
export const signInWithGooglePopup = async () => {
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken(true);
  return {
    idToken,
    profile: {
      uid: result.user.uid,
      email: result.user.email,
      name: result.user.displayName,
      photo: result.user.photoURL,
    },
  };
};

export const signOutOfFirebase = async () => {
  if (!cachedAuth) return;
  try {
    await firebaseSignOut(cachedAuth);
  } catch {
    /* ignore */
  }
};
