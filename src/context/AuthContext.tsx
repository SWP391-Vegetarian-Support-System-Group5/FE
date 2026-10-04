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
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  AuthError,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<User | null>;
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
  const [user, setUser] = useState<User | null>(null);
  // initial loading state prevents flickering when reloading page
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        setError(mapFirebaseAuthError(err));
        setLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setError(null);

    // Validate if real Firebase configuration has been supplied
    if (!isFirebaseConfigured()) {
      const msg =
        "Firebase chưa được cấu hình. Vui lòng cập nhật các biến NEXT_PUBLIC_FIREBASE_* trong file .env.local.";
      setError(msg);
      throw new Error(msg);
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
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
      await signOut(auth);
      setUser(null);
    } catch (err: unknown) {
      const friendlyMessage = mapFirebaseAuthError(err);
      setError(friendlyMessage);
      throw err;
    }
  }, []);

  const getIdToken = useCallback(
    async (forceRefresh: boolean = false): Promise<string | null> => {
      if (!user) {
        return null;
      }
      return user.getIdToken(forceRefresh);
    },
    [user]
  );

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      signInWithGoogle,
      logout,
      getIdToken,
      clearError,
    }),
    [user, loading, error, signInWithGoogle, logout, getIdToken, clearError]
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
