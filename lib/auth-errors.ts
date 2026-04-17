import type { AuthError } from 'firebase/auth';

type CodeCarrier = { code?: string };

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as CodeCarrier).code;
    if (typeof code === 'string' && code.startsWith('storage/')) {
      switch (code) {
        case 'storage/unauthorized':
        case 'storage/permission-denied':
          return 'Upload denied. Check Firebase Storage rules and that you are signed in.';
        case 'storage/canceled':
          return 'Upload was canceled.';
        case 'storage/unknown':
          return 'Storage error. If this persists, confirm Storage is enabled in Firebase and your bucket name matches the app config.';
        default:
          break;
      }
    }
    switch (code as AuthError['code']) {
      case 'auth/email-already-in-use':
        return 'That email is already registered. Try signing in.';
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled in Firebase Authentication.';
      case 'auth/requires-recent-login':
        return 'Please sign out and sign in again, then try changing your password.';
      default:
        break;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
