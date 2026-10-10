import { apiFetch } from "@/lib/api";

export interface BackendUser {
  userId: number;
  email: string;
  role: string;
  fullName: string;
  sex?: string;
  heightCm?: number;
  weightKg?: number;
  dietTypeId?: number;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
  user: BackendUser;
}

export interface RegisterResponse {
  email: string;
  message?: string;
  expiresInSeconds?: number;
}

export interface VerifyOtpResponse {
  message?: string;
  token?: string;
  user?: BackendUser;
}

export interface ResendOtpResponse {
  email: string;
  message?: string;
  expiresInSeconds?: number;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Register account: POST /api/auth/register
 * Payload must have "name", "email", "password" (BE expects "name", not "fullName")
 */
export async function registerWithApi(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    let errorMessage = "Đăng ký thất bại. Vui lòng thử lại.";
    let errData: any = null;
    try {
      errData = await res.json();
      errorMessage =
        errData.message ||
        errData.error ||
        errData.title ||
        (typeof errData === "string" ? errData : JSON.stringify(errData));
    } catch {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        errorMessage = text;
      }
    }
    throw new ApiError(errorMessage, res.status, errData);
  }

  return (await res.json()) as RegisterResponse;
}

/**
 * Verify OTP: POST /api/auth/register/verify-otp
 * Payload: { email, otpCode }
 */
export async function verifyOtpWithApi(
  email: string,
  otpCode: string,
): Promise<VerifyOtpResponse> {
  const res = await apiFetch("/api/auth/register/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otpCode }),
  });

  if (!res.ok) {
    let errorMessage = "Xác thực OTP thất bại. Vui lòng kiểm tra lại mã OTP.";
    let errData: any = null;
    try {
      errData = await res.json();
      errorMessage =
        errData.message ||
        errData.error ||
        errData.title ||
        (typeof errData === "string" ? errData : JSON.stringify(errData));
    } catch {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        errorMessage = text;
      }
    }
    throw new ApiError(errorMessage, res.status, errData);
  }

  try {
    return (await res.json()) as VerifyOtpResponse;
  } catch {
    return { message: "Xác thực thành công." };
  }
}

/**
 * Resend OTP: POST /api/auth/register/resend-otp
 * Payload: { email }
 */
export async function resendOtpWithApi(
  email: string,
): Promise<ResendOtpResponse> {
  const res = await apiFetch("/api/auth/register/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    let errorMessage = "Không thể gửi lại mã OTP. Vui lòng thử lại sau.";
    let errData: any = null;
    try {
      errData = await res.json();
      errorMessage =
        errData.message ||
        errData.error ||
        errData.title ||
        (typeof errData === "string" ? errData : JSON.stringify(errData));
    } catch {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        errorMessage = text;
      }
    }
    throw new ApiError(errorMessage, res.status, errData);
  }

  return (await res.json()) as ResendOtpResponse;
}

/**
 * Login: POST /api/auth/login
 * Payload: { email, password }
 */
export async function loginWithApi(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let errorMessage = "Email hoặc mật khẩu không đúng. Nếu chưa có tài khoản, vui lòng đăng ký trước khi đăng nhập.";
    let errData: any = null;
    try {
      errData = await res.json();
      errorMessage =
        errData.message ||
        errData.error ||
        errData.title ||
        (typeof errData === "string" ? errData : JSON.stringify(errData));
    } catch {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        errorMessage = text;
      }
    }
    throw new ApiError(errorMessage, res.status, errData);
  }

  const data = (await res.json()) as LoginResponse;

  if (typeof window !== "undefined") {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
}

/**
 * Logout: POST /api/auth/logout with Bearer token
 */
export async function logoutWithApi(): Promise<void> {
  try {
    const token = getStoredToken();
    if (token) {
      await apiFetch("/api/auth/logout", {
        method: "POST",
      });
    }
  } catch {
    // Ignore network/server errors during logout to ensure local cleanup
  } finally {
    clearStoredAuth();
  }
}

export async function updateCurrentUserLocation(
  latitude: number,
  longitude: number,
): Promise<BackendUser> {
  const res = await apiFetch("/api/users/me/location", {
    method: "PUT",
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!res.ok) {
    let errorMessage = "Không thể lưu vị trí hiện tại.";
    let errData: any = null;
    try {
      errData = await res.json();
      errorMessage =
        errData.message ||
        errData.error ||
        errData.title ||
        (typeof errData === "string" ? errData : JSON.stringify(errData));
    } catch {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        errorMessage = text;
      }
    }
    throw new ApiError(errorMessage, res.status, errData);
  }

  const user = (await res.json()) as BackendUser;
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
  return user;
}

export function getStoredUser(): BackendUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as BackendUser) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
