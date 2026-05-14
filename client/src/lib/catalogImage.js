const SVG_PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="Image unavailable"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f3f4f6"/><stop offset="100%" stop-color="#d1d5db"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><g fill="#6b7280" font-family="Arial, sans-serif" text-anchor="middle"><text x="600" y="430" font-size="44" font-weight="700">Image coming soon</text><text x="600" y="480" font-size="24">This service is ready to book</text></g></svg>`;

export const CATALOG_PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  SVG_PLACEHOLDER
)}`;

const APP_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';

const ENV_API_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).trim()
    : '';

const API_ORIGIN = (() => {
  if (!ENV_API_URL) return '';
  try {
    return new URL(ENV_API_URL, APP_ORIGIN || 'http://localhost').origin;
  } catch {
    return '';
  }
})();

export const normalizeCatalogImageUrl = (value) => {
  if (typeof value !== 'string') return '';
  const image = value.trim();
  if (!image) return '';

  if (
    image.startsWith('data:') ||
    image.startsWith('blob:') ||
    image.startsWith('http://') ||
    image.startsWith('https://')
  ) {
    return image;
  }

  if (image.startsWith('//')) {
    const protocol =
      typeof window !== 'undefined' && window.location?.protocol
        ? window.location.protocol
        : 'https:';
    return `${protocol}${image}`;
  }

  // Legacy uploads can be stored as '/uploads/...'; resolve against API host.
  if (image.startsWith('/uploads/') && API_ORIGIN) {
    return `${API_ORIGIN}${image}`;
  }

  // '/assets/...' belongs to the frontend public assets folder.
  if (image.startsWith('/')) {
    return image;
  }

  // Plain relative paths map to frontend host paths.
  return `/${image}`;
};

export const resolveCatalogImage = (item, fallback = CATALOG_PLACEHOLDER_IMAGE) => {
  const image = normalizeCatalogImageUrl(item?.image);
  return image || fallback;
};