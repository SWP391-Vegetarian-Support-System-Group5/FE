"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useSyncExternalStore,
  useRef,
} from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  AuthError,
  setPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getProfile } from "@/lib/profile-api";
import { getMediaUrl } from "@/lib/api";
import { setSessionUser } from "@/lib/auth-session";
import { subscribeSession } from "@/lib/auth-session";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import {
  BackendUser,
  LoginResponse,
  loginWithApi,
  loginWithGoogleApi,
  ApiError,
  logoutWithApi,
  getStoredToken,
  getStoredUser,
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
  signInWithGoogle: () => Promise<LoginResponse | null>;
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
      return "Đăng nhập Google thất bại. Vui lòng thử lại.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const googleLoginPending = useRef(false);
  const backendUser = useSyncExternalStore(subscribeSession, getStoredUser, () => null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    async function initialize() {
      try {
        if (isFirebaseConfigured()) {
          await firebaseSignOut(auth);
          await setPersistence(auth, inMemoryPersistence);
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }
    void initialize().catch(() => { /* Google sign-in reports configuration errors on demand. */ });

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    if (!backendUser?.userId) return;
    const token = getStoredToken();
    let active = true;
    getProfile().then(profile => {
      const current = getStoredUser();
      if (active && token && getStoredToken() === token && current?.userId === profile.userId && current.avatarUrl === backendUser.avatarUrl && current.avatarUrl !== profile.avatarUrl) {
        setSessionUser({ ...current, avatarUrl: profile.avatarUrl ?? null });
      }
    }).catch(() => { /* Keep the signed-in user when profile refresh is unavailable. */ });
    return () => { active = false; };
  }, [backendUser?.userId, backendUser?.avatarUrl]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      setError(null);
      try {
        const res = await loginWithApi(email, password);
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Đăng nhập thất bại.";
        setError(msg);
        throw err;
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<LoginResponse | null> => {
    if (googleLoginPending.current) return null;
    setError(null);

    if (!isFirebaseConfigured()) {
      const msg =
        "Firebase chưa được cấu hình. Vui lòng cập nhật các biến NEXT_PUBLIC_FIREBASE_* trong file .env.local.";
      setError(msg);
      throw new Error(msg);
    }

    googleLoginPending.current = true;
    let firebaseAuthenticated = false;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      firebaseAuthenticated = true;
      const idToken = await result.user.getIdToken();
      return await loginWithGoogleApi(idToken);
    } catch (err: unknown) {
      if (firebaseAuthenticated) await firebaseSignOut(auth).catch(() => {});
      const friendlyMessage = err instanceof ApiError
        ? err.message
        : firebaseAuthenticated
          ? err instanceof TypeError
            ? "Không kết nối được BE để lưu tài khoản Google. Vui lòng kiểm tra máy chủ và kết nối mạng."
            : err instanceof Error ? err.message : "Không thể đồng bộ tài khoản Google với máy chủ."
          : mapFirebaseAuthError(err);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      googleLoginPending.current = false;
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
    }

    try {
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch {
      // The application session has already been cleared.
    }
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => getStoredToken(), []);

  const user: AppUser | null = useMemo(() => {
    if (backendUser) {
      return {
        uid: String(backendUser.userId),
        userId: backendUser.userId,
        email: backendUser.email,
        displayName: backendUser.fullName || backendUser.email,
        fullName: backendUser.fullName,
        photoURL: backendUser.avatarUrl ? getMediaUrl(backendUser.avatarUrl) : null,
        role: backendUser.role,
        backendUser,
        getIdToken: async () => getStoredToken(),
      };
    }
    return null;
  }, [backendUser]);

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
