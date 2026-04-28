import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

import { app, getFirebaseConfig } from '@/lib/firebase-bootstrap';

export { app, getFirebaseConfig, type FirebaseWebLikeConfig } from '@/lib/firebase-bootstrap';

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

const bucket = getFirebaseConfig().storageBucket.trim();
const bucketUrl = bucket.startsWith('gs://') ? bucket : `gs://${bucket}`;
export const storage: FirebaseStorage = getStorage(app, bucketUrl);
