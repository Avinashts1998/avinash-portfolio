import { initializeApp, getApps, getApp, setLogLevel } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import appletConfig from "../firebase-applet-config.json";

// Suppress noisy Firestore connection logs when backend is unreachable or offline
try {
  setLogLevel("silent");
} catch {}

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

const rawDatabaseId = (metaEnv.VITE_FIREBASE_DATABASE_ID || "").trim();
const isDefaultDatabase = !rawDatabaseId || rawDatabaseId === "(default)" || rawDatabaseId === "default";

// Check if all essential keys are provided
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: any = null;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    if (!isDefaultDatabase) {
      db = getFirestore(app, rawDatabaseId);
    } else {
      db = getFirestore(app);
    }
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase credentials not fully configured in environment. Falling back to local storage.");
}

export { db, auth, firebaseConfig };
