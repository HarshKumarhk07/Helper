export const CATALOG_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1584820927498-cafe2c1c6843?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

const getUploadOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return '';
  try {
    return new URL(apiUrl).origin;
  } catch {
    return '';
  }
};

/**
 * Resolve any stored media reference (KYC docs, uploads, etc.) to a loadable
 * URL. Absolute URLs pass through; relative '/uploads/...' paths get the API
 * origin prefixed in prod, or stay relative in dev (Vite proxy forwards them) —
 * so the backend host never leaks into stored data or the address bar.
 */
export const mediaUrl = (src) => {
  if (!src || typeof src !== 'string') return '';
  const s = src.trim();
  if (!s || s.startsWith('file://')) return '';
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (s.startsWith('/uploads') || s.startsWith('uploads/')) {
    const origin = getUploadOrigin();
    const path = s.startsWith('/') ? s : `/${s}`;
    return origin ? `${origin}${path}` : path;
  }
  return s;
};

const resolveCandidate = (value) => {
  if (typeof value === 'string') return mediaUrl(value);
  if (value && typeof value === 'object') {
    return mediaUrl(value.url || value.src || value.image || value.path);
  }
  return '';
};

export const resolveCatalogImage = (item, fallback = CATALOG_PLACEHOLDER_IMAGE) => {
  if (typeof item === 'string') {
    return resolveCandidate(item) || fallback;
  }

  const candidates = [
    item?.image,
    item?.imageUrl,
    item?.thumbnail,
    item?.coverImage,
    item?.media,
    item?.media?.url,
    item?.media?.src,
    item?.images?.[0],
    item?.assets?.[0],
  ];

  for (const candidate of candidates) {
    const resolved = resolveCandidate(candidate);
    if (resolved) return resolved;
  }

  return fallback;
};