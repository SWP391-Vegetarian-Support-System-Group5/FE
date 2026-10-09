"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  AuthError,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import {
  BackendUser,
  LoginResponse,
  loginWithApi,
  logoutWithApi,
  getStoredUser,
  getStoredToken,
  clearStoredAuth,
} from "@/lib/auth";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  fullName?: string | null;
  photoURL?: string | null;
  role?: string;
  userId?: number;
  backendUser?: BackendUser;
  getIdToken?: (forceRefresh?: boolean) => Promise<string | null>;
}

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  loginWithCredentials: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseAuthError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Đã xảy ra lỗi không xác định khi xác thực.";
  }

  const authError = error as AuthError;
  const code = authError.code;

  switch (code) {
    case "auth/popup-closed-by-user":
      return "Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.";
    case "auth/cancelled-popup-request":
      return "Yêu cầu đăng nhập đã bị hủy do có thao tác mới.";
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ popup. Vui lòng cấp quyền mở popup cho trang web này để đăng nhập Google.";
    case "auth/unauthorized-domain":
      return "Tên miền hiện tại (hoặc localhost) chưa được thêm vào mục Authorized Domains trong Firebase Console (Authentication > Settings).";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet của bạn.";
    case "auth/account-exists-with-different-credential":
      return "Email này đã được liên kết với một phương thức đăng nhập khác.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "Khóa API Firebase không hợp lệ. Vui lòng kiểm tra lại biến môi trường NEXT_PUBLIC_FIREBASE_API_KEY trong file .env.local.";
    case "auth/operation-not-allowed":
      return "Phương thức đăng nhập Google chưa được bật trong Firebase Console (Authentication > Sign-in method).";
    default:
      return authError.message || "Đăng nhập Google thất bại. Vui lòng thử lại.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Restore backend user from localStorage
    const savedUser = getStoredUser();
    if (savedUser) {
      setBackendUser(savedUser);
    }

    // 2. Listen to Firebase auth state changes
    let isSubscribed = true;
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentFirebaseUser) => {
        if (!isSubscribed) return;
        setFirebaseUser(currentFirebaseUser);
        setLoading(false);
      },
      (err) => {
        if (!isSubscribed) return;
        setError(mapFirebaseAuthError(err));
        setLoading(false);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      setError(null);
      try {
        const res = await loginWithApi(email, password);
        setBackendUser(res.user);
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Đăng nhập thất bại.";
        setError(msg);
        throw err;
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<FirebaseUser | null> => {
    setError(null);

    if (!isFirebaseConfigured()) {
      const msg =
        "Firebase chưa được cấu hình. Vui lòng cập nhật các biến NEXT_PUBLIC_FIREBASE_* trong file .env.local.";
      setError(msg);
      throw new Error(msg);
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(result.user);
      return result.user;
    } catch (err: unknown) {
      const friendlyMessage = mapFirebaseAuthError(err);
      setError(friendlyMessage);
      throw err;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      // If we have a backend session, call backend logout API
      await logoutWithApi();
    } catch {
      // Ignore errors during API logout
    } finally {
      clearStoredAuth();
      setBackendUser(null);
    }

    try {
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
      setFirebaseUser(null);
    } catch {
      setFirebaseUser(null);
    }
  }, []);

  const getIdToken = useCallback(
    async (forceRefresh: boolean = false): Promise<string | null> => {
      if (firebaseUser) {
        return firebaseUser.getIdToken(forceRefresh);
      }
      return getStoredToken();
    },
    [firebaseUser]
  );

  const user: AppUser | null = useMemo(() => {
    if (backendUser) {
      return {
        uid: String(backendUser.userId),
        userId: backendUser.userId,
        email: backendUser.email,
        displayName: backendUser.fullName || backendUser.email,
        fullName: backendUser.fullName,
        photoURL: null,
        role: backendUser.role,
        backendUser,
        getIdToken: async () => getStoredToken(),
      };
    }
    if (firebaseUser) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        fullName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        getIdToken: firebaseUser.getIdToken.bind(firebaseUser),
      };
    }
    return null;
  }, [backendUser, firebaseUser]);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      signInWithGoogle,
      loginWithCredentials,
      logout,
      getIdToken,
      clearError,
    }),
    [
      user,
      loading,
      error,
      signInWithGoogle,
      loginWithCredentials,
      logout,
      getIdToken,
      clearError,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
