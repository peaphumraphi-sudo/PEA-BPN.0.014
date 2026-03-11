import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDnL4rtmMx4YFR67sQNVt3Dfbcjw3B7B7Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pea-bpn-inventory.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pea-bpn-inventory",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pea-bpn-inventory.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "484483009459",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:484483009459:web:d3f6614de82a68b46a59c6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-H6QXT08HD1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const isFirebaseEnabled = !!(import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId);

// Initialize Firestore with long polling to bypass potential network restrictions in iframes
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
