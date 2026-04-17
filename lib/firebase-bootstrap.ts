import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

export type FirebaseWebLikeConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export function getFirebaseConfig(): FirebaseWebLikeConfig {
  const cfg = Constants.expoConfig?.extra?.firebaseConfig as FirebaseWebLikeConfig | undefined;
  if (
    !cfg?.apiKey ||
    !cfg.authDomain ||
    !cfg.projectId ||
    !cfg.storageBucket ||
    !cfg.messagingSenderId ||
    !cfg.appId
  ) {
    throw new Error(
      'Firebase is not configured: missing extra.firebaseConfig. Ensure app.config.ts loads google-services.json.'
    );
  }
  return cfg;
}

export function getOrCreateApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(getFirebaseConfig());
}

export const app = getOrCreateApp();
