import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, Persistence } from 'firebase/auth';

import { app } from '@/lib/firebase-bootstrap';

export { app, type FirebaseWebLikeConfig } from '@/lib/firebase-bootstrap';

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
