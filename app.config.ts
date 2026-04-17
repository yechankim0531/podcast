import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ExpoConfig } from 'expo/config';

type GoogleServicesJson = {
  project_info: {
    project_number: string;
    project_id: string;
    storage_bucket: string;
  };
  client: Array<{
    client_info: { mobilesdk_app_id: string };
    api_key: Array<{ current_key: string }>;
    oauth_client?: Array<{ client_id: string; client_type: number }>;
  }>;
};

function readGoogleServiceInfoClientId(): string | undefined {
  try {
    const raw = readFileSync(join(__dirname, 'GoogleService-Info.plist'), 'utf8');
    const match = raw.match(/<key>CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);
    return match?.[1]?.trim();
  } catch {
    return undefined;
  }
}

function readAndroidGoogleOAuthClientId(): string | undefined {
  try {
    const path = join(__dirname, 'google-services.json');
    const raw = JSON.parse(readFileSync(path, 'utf8')) as GoogleServicesJson;
    const oauth = raw.client?.[0]?.oauth_client;
    const android = oauth?.find((c) => c.client_type === 1) ?? oauth?.[0];
    return android?.client_id?.trim();
  } catch {
    return undefined;
  }
}

function readFirebaseConfigFromGoogleServices(): {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
} {
  const path = join(__dirname, 'google-services.json');
  const raw = JSON.parse(readFileSync(path, 'utf8')) as GoogleServicesJson;
  const client = raw.client?.[0];
  if (!client?.api_key?.[0]?.current_key || !client.client_info?.mobilesdk_app_id) {
    throw new Error(
      'app.config: google-services.json is missing client credentials. Re-download from Firebase.'
    );
  }
  const { project_id, project_number, storage_bucket } = raw.project_info;
  const appId =
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() || client.client_info.mobilesdk_app_id;

  return {
    apiKey: client.api_key[0].current_key,
    authDomain: `${project_id}.firebaseapp.com`,
    projectId: project_id,
    storageBucket: storage_bucket,
    messagingSenderId: String(project_number),
    appId,
  };
}

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const firebaseConfig = readFirebaseConfigFromGoogleServices();
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
  /** Used for Expo Go Google OAuth: https://auth.expo.io/<this> — must match an Authorized redirect URI on the Web client. */
  const expoAuthProxyFullName =
    process.env.EXPO_PUBLIC_EXPO_AUTH_PROXY_FULL_NAME?.trim() ||
    (config.slug ? `@anonymous/${config.slug}` : '');

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to access your photos to set your profile picture.',
        },
      ],
    ],
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.yechankim.podcastmvp',
      googleServicesFile: './GoogleService-Info.plist',
    },
    android: {
      ...config.android,
      package: 'com.yechankim.podcastmvp',
      googleServicesFile: './google-services.json',
    },
    extra: {
      ...config.extra,
      firebaseConfig,
      googleAuth: {
        /** Web OAuth client ID (Firebase Console → Project settings → Web app, or Google Cloud OAuth "Web client"). Required for Expo Go. */
        webClientId,
        iosClientId: readGoogleServiceInfoClientId(),
        androidClientId: readAndroidGoogleOAuthClientId(),
        expoAuthProxyFullName,
      },
    },
  };
};
