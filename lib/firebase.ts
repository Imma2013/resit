import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Placeholder values (for example "set-in-vercel-dashboard") must never
// trigger Firebase initialization: an invalid authDomain crashes the server
// during prerendering. Firebase only initializes in the browser once real
// values that look like a Firebase project are configured.
const hasClientConfig =
  Boolean(config.apiKey) &&
  Boolean(config.projectId) &&
  Boolean(config.appId) &&
  typeof config.authDomain === 'string' &&
  /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(config.authDomain);

export const firebaseApp: FirebaseApp | null = hasClientConfig && typeof window !== 'undefined'
  ? (getApps().length ? getApp() : initializeApp(config))
  : null;
export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const googleProvider = firebaseAuth ? new GoogleAuthProvider() : null;