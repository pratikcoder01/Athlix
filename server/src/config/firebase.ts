import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';

/**
 * Initialise Firebase Admin SDK once.
 */
let app: App;

const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error(
    '❌ FIREBASE_PROJECT_ID is not set. Add it to server/.env before starting.'
  );
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const appsList = getApps();

if (appsList.length === 0) {
  if (serviceAccountJson) {
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error(
        '❌ FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Check your env var.'
      );
    }

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  } else {
    app = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  console.log(`🔥 Firebase Admin SDK initialised for project: ${projectId}`);
} else {
  app = appsList[0];
}

import { getAuth } from 'firebase-admin/auth';
export const authAdmin = getAuth(app);
export default app;

