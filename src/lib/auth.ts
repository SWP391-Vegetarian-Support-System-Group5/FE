import { apiFetch } from "@/lib/api";
import { clearSession, readSessionToken, readSessionUser, setSession, setSessionUser } from "./auth-session";

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

export interface PasswordResetResponse {
  message?: string;
  email?: string;
  expiresInSeconds?: number;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function responseError(res: Response, fallback: string): Promise<ApiError> {
  const text = await res.text();
  let data: unknown = null;
  let message = text.trim() || fallback;
  if (text.trim()) {
    try {
      data = JSON.parse(text) as unknown;
      if (typeof data === "string") message = data || fallback;
      else if (data && typeof data === "object") {
        const fields = data as Record<string, unknown>;
        const detail = [fields.message, fields.error, fields.title].find(value => typeof value === "string" && value.trim());
        if (typeof detail === "string") message = detail;
      }
    } catch { /* Plain-text error responses are valid too. */ }
  }
  return new ApiError(message, res.status, data);
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
    throw await responseError(res, "Đăng ký thất bại. Vui lòng thử lại.");
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
    throw await responseError(res, "Xác thực OTP thất bại. Vui lòng kiểm tra lại mã OTP.");
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
    throw await responseError(res, "Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
  }

  return (await res.json()) as ResendOtpResponse;
}

export async function requestPasswordResetWithApi(email: string): Promise<PasswordResetResponse> {
  const res = await apiFetch("/api/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await responseError(res, "Không thể gửi mã đặt lại mật khẩu.");
  return (await res.json()) as PasswordResetResponse;
}

export async function resetPasswordWithApi(email: string, otpCode: string, newPassword: string): Promise<PasswordResetResponse> {
  const res = await apiFetch("/api/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({ email, otpCode, newPassword }),
  });
  if (!res.ok) throw await responseError(res, "Không thể đặt lại mật khẩu.");
  return (await res.json()) as PasswordResetResponse;
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
    throw await responseError(res, "Email hoặc mật khẩu không đúng. Nếu chưa có tài khoản, vui lòng đăng ký trước khi đăng nhập.");
  }

  const data = (await res.json()) as LoginResponse;

  setSession(data.token, data.user);

  return data;
}

/**
 * Logout: POST /api/auth/logout with Bearer token
 */
export async function logoutWithApi(): Promise<void> {
  const token = getStoredToken();
  clearStoredAuth();
  try {
    if (token) {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // Ignore network/server errors during logout to ensure local cleanup
  }
}

export async function updateCurrentUserLocation(
  latitude: number,
  longitude: number,
): Promise<BackendUser> {
  const sessionToken = getStoredToken();
  const res = await apiFetch("/api/users/me/location", {
    method: "PUT",
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!res.ok) {
    throw await responseError(res, "Không thể lưu vị trí hiện tại.");
  }

  const user = (await res.json()) as BackendUser;
  if (getStoredToken() === sessionToken && sessionToken) setSessionUser(user);
  return user;
}

export function getStoredUser(): BackendUser | null {
  return readSessionUser();
}

export function getStoredToken(): string | null {
  return readSessionToken();
}

export function clearStoredAuth(): void {
  clearSession();
}
