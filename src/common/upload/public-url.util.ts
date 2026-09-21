import { Request } from 'express';

/**
 * Prefer APP_URL when set; otherwise derive from the current request
 * (works for local and production, including reverse proxies).
 */
export function buildRequestOrigin(
  request: Request,
  appUrl?: string | null,
): string {
  const configured = appUrl?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const forwardedProto = headerFirst(request.headers['x-forwarded-proto']);
  const protocol = forwardedProto ?? request.protocol ?? 'http';

  const forwardedHost = headerFirst(request.headers['x-forwarded-host']);
  const host = forwardedHost ?? request.get('host') ?? 'localhost';

  return `${protocol}://${host}`;
}

/** Turn a stored relative upload path into an absolute URL for clients. */
export function toPublicUrl(
  value: string | null | undefined,
  origin: string,
): string | null {
  if (value == null || value === '') {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const path = value.startsWith('/') ? value : `/${value}`;
  return `${origin.replace(/\/$/, '')}${path}`;
}

function headerFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.split(',')[0]?.trim();
  }

  return value?.split(',')[0]?.trim();
}
