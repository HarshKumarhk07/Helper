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