import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
} from 'firebase/auth';

/**
 * Firebase client SDK configuration.
 * All values come from NEXT_PUBLIC_FIREBASE_* environment variables.
 *
 * Add these to client/.env.local:
 *   NEXT_PUBLIC_FIREBASE_API_KEY=...
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
 *   NEXT_PUBLIC_FIREBASE_APP_ID=...
 */
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key-value-for-prerendering',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mock-auth-domain-for-prerendering',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project-id',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'mock-app-id',
};

// Guard against hot-reload double-initialisation in Next.js
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Connect to Firebase Auth Emulator in local development
if (
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true'
) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

export default app;
