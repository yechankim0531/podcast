import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/lib/firebase';

/**
 * React Native: `fetch(uri).blob()` often breaks for Android `content://` library URIs.
 * XHR + blob matches what Firebase RN samples use for reliable local file reads.
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const blob = xhr.response as Blob;
      if (blob != null && (xhr.status === 200 || xhr.status === 0)) {
        resolve(blob);
        return;
      }
      reject(new Error('Could not read the image file.'));
    };
    xhr.onerror = () => reject(new Error('Could not read the image file.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send();
  });
}

function imageContentType(blob: Blob): string {
  const t = blob.type;
  if (t && t.startsWith('image/')) return t;
  return 'image/jpeg';
}

export async function uploadProfilePhotoToStorage(userId: string, localUri: string): Promise<string> {
  const blob = await uriToBlob(localUri);
  const objectPath = `profile_photos/${userId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, objectPath);
  await uploadBytes(storageRef, blob, { contentType: imageContentType(blob) });
  return getDownloadURL(storageRef);
}
