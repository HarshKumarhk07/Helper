export const CATALOG_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1584820927498-cafe2c1c6843?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

export const resolveCatalogImage = (item, fallback = CATALOG_PLACEHOLDER_IMAGE) => {
  const image = item?.image;
  return typeof image === 'string' && image.trim() ? image.trim() : fallback;
};