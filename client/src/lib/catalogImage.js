// Inline SVG placeholder rendered as a data URI. Used when a catalog item has
// no usable image. Two reasons we don't use a remote Unsplash photo here:
//  1. CORB / strict-shield browsers (Brave) sometimes block third-party
//     images-as-cards, leaving an unstyled grey box.
//  2. A data URI loads instantly, has no network cost, and can't 404.
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#EFE8DC"/>
      <stop offset="1" stop-color="#D8CCB6"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <g fill="none" stroke="#9C8B6F" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="100" y="120" width="200" height="160" rx="14"/>
    <circle cx="160" cy="180" r="18"/>
    <path d="M120 260 L180 200 L230 240 L270 210 L290 260 Z" fill="#9C8B6F" fill-opacity="0.25"/>
  </g>
  <text x="200" y="335" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif"
        font-size="22" font-weight="600" fill="#7B6A4F" letter-spacing="3">NO IMAGE</text>
</svg>`;

export const CATALOG_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

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