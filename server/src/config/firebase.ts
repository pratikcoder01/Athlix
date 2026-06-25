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
      // Robust cleaning: strip outer quotes if pasted with them, and parse
      let cleanedJson = serviceAccountJson.trim();
      
      // Auto-detect and decode Base64 if it does not start with a curly brace
      if (!cleanedJson.startsWith('{')) {
        try {
          const decoded = Buffer.from(cleanedJson, 'base64').toString('utf8');
          if (decoded.trim().startsWith('{')) {
            cleanedJson = decoded.trim();
          }
        } catch (e) {
          // Not base64, proceed with raw text cleaning
        }
      }

      if ((cleanedJson.startsWith('"') && cleanedJson.endsWith('"')) || (cleanedJson.startsWith("'") && cleanedJson.endsWith("'"))) {
        cleanedJson = cleanedJson.substring(1, cleanedJson.length - 1);
      }
      
      // Sanitize raw newlines inside the private_key string value if they pasted it raw
      cleanedJson = cleanedJson.replace(/"private_key"\s*:\s*"([\s\S]*?)"/, (match, keyContent) => {
        const escapedKey = keyContent.replace(/\r?\n/g, '\\n');
        return `"private_key": "${escapedKey}"`;
      });

      serviceAccount = JSON.parse(cleanedJson);
      if (serviceAccount && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    } catch (err: any) {
      console.error('❌ Failed parsing FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
      throw new Error(
        '❌ FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Check that you pasted the entire, raw contents of your Firebase service account key JSON file directly into the Render env var value field (without any wrapping quotes or backslashes). Alternatively, base64-encode it and set it.'
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

