import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth, User } from "firebase/auth";

// Firebase web configuration (client-side only)
// Values are read from Next.js NEXT_PUBLIC_ environment variables.
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDummyKeyForBuildOnly123456789",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase App as a singleton
const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Checks if real Firebase configuration variables have been provided in the environment.
 */
export function isFirebaseConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return Boolean(
    apiKey &&
      apiKey !== "AIzaSyDummyKeyForBuildOnly123456789" &&
      apiKey.trim().length > 0
  );
}

/**
 * Utility to retrieve current user's Firebase ID token for future backend authorization.
 *
 * NOTE:
 * - Does NOT print token to console
 * - Does NOT persist token into localStorage
 * - Returns Firebase ID token (JWT), NOT Google OAuth access token
 *
 * @param forceRefresh Force token refresh if expired
 */
export async function getFirebaseIdToken(
  forceRefresh: boolean = false
): Promise<string | null> {
  const currentUser: User | null = auth.currentUser;
  if (!currentUser) {
    return null;
  }
  return currentUser.getIdToken(forceRefresh);
}

export default app;
