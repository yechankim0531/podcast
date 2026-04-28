import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, Persistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

import { app, getFirebaseConfig } from '@/lib/firebase-bootstrap';

export { app, getFirebaseConfig, type FirebaseWebLikeConfig } from '@/lib/firebase-bootstrap';

export const db: Firestore = getFirestore(app);

const bucket = getFirebaseConfig().storageBucket.trim();
const bucketUrl = bucket.startsWith('gs://') ? bucket : `gs://${bucket}`;
export const storage: FirebaseStorage = getStorage(app, bucketUrl);

type NativeAuthModule = {
  initializeAuth: (app: FirebaseApp, deps: { persistence: Persistence }) => Auth;
  getAuth: (app: FirebaseApp) => Auth;
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

// Metro resolves @firebase/auth to the RN build (includes getReactNativePersistence).
const { initializeAuth, getAuth, getReactNativePersistence } = require('@firebase/auth') as NativeAuthModule;

function createNativeAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth: Auth = createNativeAuth();
