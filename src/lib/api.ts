/**
 * Centralized API client for communicating with the ASP.NET Core backend.
 *
 * All backend requests MUST go through this module so the base URL is managed
 * in a single place via the NEXT_PUBLIC_API_BASE_URL environment variable.
 *
 * Usage:
 *   import { apiFetch } from "@/lib/api";
 *   const data = await apiFetch("/api/recipes");
 *   const created = await apiFetch("/api/recipes", { method: "POST", body: JSON.stringify(payload) });
 */

const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Thin wrapper around the native `fetch` that automatically prepends the
 * backend base URL and sets sensible defaults for JSON APIs.
 *
 * @param path    - The API path (e.g. "/api/auth/login"). Must start with "/".
 * @param options - Standard RequestInit options (method, headers, body, etc.)
 * @returns       - The raw Response object so callers can handle status codes.
 *
 * @example
 * // GET request
 * const res = await apiFetch("/api/recipes");
 * const recipes = await res.json();
 *
 * @example
 * // POST request with JSON body
 * const res = await apiFetch("/api/recipes", {
 *   method: "POST",
 *   body: JSON.stringify({ name: "New recipe" }),
 * });
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers);
  // Default to JSON content-type if not already set and body is present
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
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
