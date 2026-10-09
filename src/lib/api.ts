/**
 * Centralized API client for communicating with the ASP.NET Core backend.
 *
 * All backend requests go through this module so the base URL is managed
 * in a single place via the NEXT_PUBLIC_API_BASE_URL environment variable.
 */

const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  "https://localhost:7058";

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
  // Default to JSON content-type if not already set and body is present
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Automatically attach Bearer token if present in localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(url, {
    ...options,
    headers,
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
