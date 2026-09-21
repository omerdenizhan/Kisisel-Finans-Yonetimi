export class ApiError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
  }
}

const BASE = '/api';
const STORAGE_KEY = 'kisisel_finans_auth_token';

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(STORAGE_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let payload: unknown = undefined;
    try {
      payload = await res.json();
    } catch {
      /* ignore */
    }
    const message =
      (payload as { error?: string })?.error ?? `HTTP ${res.status}`;

    if (res.status === 401 && !path.startsWith('/auth/login')) {
      localStorage.removeItem(STORAGE_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    throw new ApiError(res.status, message, payload);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

