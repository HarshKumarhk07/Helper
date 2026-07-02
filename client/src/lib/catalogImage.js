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

export const getCustomServiceImage = (item) => {
  if (!item) return '';
  const name = String(item.name || (typeof item === 'string' ? item : '')).toLowerCase();
  const cat = String(item.category?.name || '').toLowerCase();
  const slug = String(item.category?.slug || '').toLowerCase();

  // Custom image synchronization matching SpacesWeSpecialize.jsx exactly
  if (name.includes('utensil') || name.includes('dish') || name.includes('plate')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLQExiMy0xbTowGZcP0LIJr67JayabswnbUZIGmR6sKZ4oL2t_7m8P0z7R&s=10';
  }
  if (name.includes('pet') || name.includes('dog') || name.includes('cat') || slug.includes('pet')) {
    return 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=300&h=300';
  }
  if (name.includes('child') || name.includes('baby') || name.includes('nanny') || name.includes('tuition') || name.includes('class') || name.includes('coaching') || name.includes('education') || name.includes('school')) {
    return 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=300&h=300';
  }
  if (name.includes('garden') || name.includes('lawn') || name.includes('plant') || name.includes('tree') || name.includes('gardener')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjmZI_oTEs9rFP5bvJXfmUQelaey5qWtaF3gBRxmABRQ&s=10';
  }
  if (name.includes('cooler')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-iMoUvCxEIgYTCorCtddNlu3ep5Gwz-X-SjYWdzLIeA&s=10';
  }
  if (name.includes('ac ') || name.includes('air cond') || name.startsWith('ac') || name.includes('appliance') || slug.includes('appliance')) {
    // Only map if it's a service (avoid mapping AC appliances or products)
    if (!item.price || cat.includes('service') || slug.includes('service') || name.includes('repair') || name.includes('service') || name.includes('install')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=300&h=300';
    }
  }
  if (name.includes('plumb') || name.includes('leak') || name.includes('tap') || name.includes('pipe') || name.includes('tank') || name.includes('drain')) {
    if (!item.price || cat.includes('service') || slug.includes('service') || name.includes('repair') || name.includes('service') || name.includes('install')) {
      return 'https://t4.ftcdn.net/jpg/01/99/81/11/360_F_199811106_Td5Yi9Jbua2w3pUslZoK8EpUxFlPISvc.jpg';
    }
  }
  if (name.includes('electric') || name.includes('wiring') || name.includes('fuse') || name.includes('switch') || name.includes('fan') || name.includes('cctv')) {
    if (!item.price || cat.includes('service') || slug.includes('service') || name.includes('repair') || name.includes('service') || name.includes('install')) {
      return 'https://img.magnific.com/free-photo/man-electrical-technician-working-switchboard-with-fuses_169016-24062.jpg?semt=ais_hybrid&w=740&q=80';
    }
  }
  if (name.includes('deep cleaning') || name.includes('clean') || name.includes('sofa') || name.includes('carpet') || name.includes('pest') || name.includes('control') || name.includes('bug') || name.includes('cockroach') || name.includes('termite') || name.includes('mosquito') || slug.includes('cleaning')) {
    return 'https://img.magnific.com/free-photo/man-doing-professional-home-cleaning-service_23-2150359025.jpg?semt=ais_hybrid&w=740&q=80';
  }
  if (name.includes('car wash') || name.includes('wash') || name.includes('detail') || name.includes('vehicle') || slug.includes('car')) {
    return 'https://img.magnific.com/free-photo/professional-washer-blue-uniform-washing-luxury-car-with-water-gun-open-air-car-wash_496169-333.jpg';
  }
  if (name.includes('carpent') || name.includes('furniture') || name.includes('wood') || name.includes('door') || name.includes('lock') || name.includes('shift') || name.includes('relocat') || name.includes('pack') || name.includes('move') || slug.includes('packers')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyuXM7ZRTdg2AnwGytkdkpyK7mN8czrcqGmuQ06p8BItVeY_VkL-IVh6g&s=10';
  }
  if (name.includes('paint') || name.includes('waterproof') || name.includes('texture') || slug.includes('painting')) {
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUqSQumj2Ue05o3dyeDsCpAb_Icyr-xgEoQgXJHh_cg-n_k13K4STeAAg&s=10';
  }

  return '';
};

export const resolveCatalogImage = (item, fallback = CATALOG_PLACEHOLDER_IMAGE) => {
  const customImg = getCustomServiceImage(item);
  if (customImg) return customImg;

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