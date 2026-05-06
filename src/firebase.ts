import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJSON from '../firebase-applet-config.json';

// Robust logic for merging environment variables with config file
const getConfigValue = (envKey: string, configValue: string) => {
  const envValue = import.meta.env[envKey];
  
  // Check if environment variable is valid and not a placeholder
  const isInvalid = !envValue || 
                   envValue === 'undefined' || 
                   envValue === '' || 
                   envValue.startsWith('your_') ||
                   envValue.includes('placeholder') ||
                   envValue.length < 5; // Real keys/IDs are usually reasonably long

  if (isInvalid) {
    return configValue;
  }
  return envValue;
};

const firebaseConfig = {
  apiKey: getConfigValue('VITE_FIREBASE_API_KEY', firebaseConfigJSON.apiKey),
  authDomain: getConfigValue('VITE_FIREBASE_AUTH_DOMAIN', firebaseConfigJSON.authDomain),
  projectId: getConfigValue('VITE_FIREBASE_PROJECT_ID', firebaseConfigJSON.projectId),
  storageBucket: getConfigValue('VITE_FIREBASE_STORAGE_BUCKET', firebaseConfigJSON.storageBucket),
  messagingSenderId: getConfigValue('VITE_FIREBASE_MESSAGING_SENDER_ID', firebaseConfigJSON.messagingSenderId),
  appId: getConfigValue('VITE_FIREBASE_APP_ID', firebaseConfigJSON.appId),
  firestoreDatabaseId: getConfigValue('VITE_FIREBASE_FIRESTORE_DATABASE_ID', firebaseConfigJSON.firestoreDatabaseId),
};

// Diagnostic check for Auth configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  console.error("Critical Firebase Auth fields (apiKey or authDomain) are missing. Check your environment variables and firebase-applet-config.json.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
  } catch (error: any) {
    if (error?.message?.includes('offline')) {
      console.warn("Firestore appears to be offline. Please check your internet connection.");
    }
  }
}
testConnection();
