/**
 * Centralized API client for communicating with the ASP.NET Core backend.
 *
 * All backend requests go through this module so the base URL is managed
 * in a single place via the NEXT_PUBLIC_API_BASE_URL environment variable.
 */

import { readSessionToken } from "./auth-session";

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  "https://localhost:7058";

export function getMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) {
    return path;
  }
  const base = API_BASE_URL.replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/**
 * Thin wrapper around the native `fetch` that automatically prepends the
 * backend base URL and sets sensible defaults for JSON APIs.
 *
 * @param path    - The API path (e.g. "/api/auth/login"). Must start with "/".
 * @param options - Standard RequestInit options (method, headers, body, etc.)
 * @returns       - The raw Response object so callers can handle status codes.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;

  const headers = new Headers(options.headers);
  // Default to JSON content-type if not already set, body is present, and not FormData
  if (
    options.body &&
    !(typeof FormData !== "undefined" && options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  // Use the same session token for JSON requests and multipart uploads.
  if (typeof window !== "undefined") {
    const token = readSessionToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export interface UploadOptions {
  onProgress?: (percent: number | null) => void;
  signal?: AbortSignal;
}

/** XMLHttpRequest exposes real upload progress; fetch does not expose this in browsers. */
export function apiUpload(path: string, body: FormData, options: UploadOptions = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted) { reject(new DOMException("Upload cancelled", "AbortError")); return; }
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const cleanup = () => options.signal?.removeEventListener("abort", abort);
    xhr.open("POST", `${API_BASE_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`);
    const token = readSessionToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    // The browser supplies the multipart Content-Type and boundary.
    xhr.upload.onprogress = event => options.onProgress?.(event.lengthComputable && event.total > 0 ? Math.min(100, Math.floor(event.loaded / event.total * 100)) : null);
    xhr.upload.onload = () => options.onProgress?.(100);
    xhr.onload = () => {
      cleanup();
      if (!xhr.status) { reject(new Error("Upload connection failed")); return; }
      resolve(new Response(xhr.status === 204 || xhr.status === 304 ? null : xhr.responseText, { status: xhr.status, statusText: xhr.statusText, headers: { "Content-Type": xhr.getResponseHeader("Content-Type") || "application/json" } }));
    };
    xhr.onerror = () => { cleanup(); reject(new Error("Upload connection failed")); };
    xhr.onabort = () => { cleanup(); reject(new DOMException("Upload cancelled", "AbortError")); };
    options.signal?.addEventListener("abort", abort, { once: true });
    xhr.send(body);
  });
}

/**
 * Convenience helper: performs a GET request and parses the JSON response.
 * Throws if the response is not OK.
 */
export async function apiGet<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, { ...options, method: "GET" });
  if (!res.ok) {
    throw new Error(`API GET ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Convenience helper: performs a POST request with a JSON body and parses
 * the JSON response. Throws if the response is not OK.
 */
export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  options: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API POST ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Convenience helper: performs a PUT request with a JSON body and parses
 * the JSON response. Throws if the response is not OK.
 */
export async function apiPut<T = unknown>(
  path: string,
  body: unknown,
  options: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API PUT ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
