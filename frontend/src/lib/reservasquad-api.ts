import { signOut } from 'next-auth/react';
import { routing } from '@/i18n/routing';
import { Routes } from '@/lib/routes';

const base = () => (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

/** Login path preserving active locale (`/login` vs `/en/login`). */
function localizedLoginCallbackUrl(): string {
  if (typeof window === 'undefined') return Routes.Login;
  const localePrefix = window.location.pathname.match(/^\/([a-z]{2})(?=\/|$)/);
  const loc = localePrefix?.[1];
  if (!loc || loc === routing.defaultLocale) {
    return Routes.Login;
  }
  return `/${loc}${Routes.Login}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: unknown = undefined,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function backendFetch<T>(
  accessToken: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${base()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed !== null && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : res.statusText;
    const err = new ApiError(res.status, msg || 'Request failed', parsed);

    /** Expired or invalid bearer token — end NextAuth session and send user to login. */
    if (res.status === 401 && typeof window !== 'undefined') {
      void signOut({
        callbackUrl: localizedLoginCallbackUrl(),
        redirect: true,
      });
    }

    throw err;
  }

  return parsed as T;
}

/** Unauthenticated requests (public calendar + booking) */
export async function backendFetchPublic<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${base()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed !== null && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : res.statusText;
    throw new ApiError(res.status, msg || 'Request failed', parsed);
  }

  return parsed as T;
}
