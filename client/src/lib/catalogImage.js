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

export const resolveCatalogImage = (item, fallback = CATALOG_PLACEHOLDER_IMAGE) => {
  const image = item?.image;

  if (typeof image === 'string' && image.trim()) {
    const trimmed = image.trim();
    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
      const origin = getUploadOrigin();
      return origin ? `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}` : trimmed;
    }
    if (!trimmed.startsWith('file://')) {
      return trimmed;
    }
  }
  
  return fallback;
};