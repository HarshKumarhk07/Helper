import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { SUBCATEGORY_FALLBACK_IMAGE, resolveCategoryHref } from '../../data/servicesData.js';
import { listCategories } from '../../api/categories.js';
import { listServices } from '../../api/services.js';
import { resolveCatalogImage } from '../../lib/catalogImage.js';

// Tolerant matching helper: ignore case + punctuation so "Wall Texture |
// Decor" matches a service named "wall texture and decor", and "Home
// Painting" matches "home painting service".
const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Compact form — strip every non-alphanumeric. Lets "Hair | Makeup" match
// "Hair Make Up" (both collapse to "hairmakeup") and "Haircut | Grooming"
// match "Hair Cut | Grooming" (both → "haircutgrooming"). Catches the very
// common case where the modal label and the catalog service name only
// differ in whitespace/punctuation.
const compact = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

// Pick the best service photo for a subcategory label. Searches the live
// catalog so admin-uploaded images flow through automatically. Returns the
// matched service object (caller resolves the image) or null when nothing
// remotely matches. `excludeIds` lets the caller avoid showing the same
// service in two tiles of the same modal.
const pickServiceForSub = (services, sub, excludeIds = new Set()) => {
  if (!services?.length) return null;
  const target = normalize(sub.label);
  const targetCompact = compact(sub.label);
  const targetTokens = target.split(' ').filter(Boolean);

  // Pass 1: exact normalized name match (best signal).
  let found = target
    ? services.find((s) => normalize(s.name) === target && !excludeIds.has(String(s._id)))
    : null;

  // Pass 1b: compact-form equality. Catches whitespace/punctuation drift
  // between the curated modal label and the admin-typed service name —
  // e.g. "Hair | Makeup" ↔ "Hair Make Up", "Haircut | Grooming" ↔
  // "Hair Cut | Grooming". This is the single most useful pass because
  // admins routinely type variant spellings of the same service.
  if (!found && targetCompact) {
    found = services.find((s) => {
      if (excludeIds.has(String(s._id))) return false;
      return compact(s.name) === targetCompact;
    });
  }

  // Pass 2: service name contains the whole label (or vice versa). Now
  // tries both the spaced and compact forms so "haircut grooming" matches
  // a service literally named "Hair Cut Grooming Premium".
  if (!found && target) {
    found = services.find((s) => {
      if (excludeIds.has(String(s._id))) return false;
      const name = normalize(s.name);
      const nameCompact = compact(s.name);
      return (
        name.includes(target) ||
        target.includes(name) ||
        nameCompact.includes(targetCompact) ||
        targetCompact.includes(nameCompact)
      );
    });
  }

  // Pass 3: all label tokens appear in service name + category.
  if (!found && targetTokens.length) {
    found = services.find((s) => {
      if (excludeIds.has(String(s._id))) return false;
      const haystack = `${normalize(s.name)} ${normalize(s.category?.name)}`;
      return targetTokens.every((t) => haystack.includes(t));
    });
  }

  // Pass 4: parent category fallback — when no service name matches, just
  // pick any service in the same parent category (cycling through unused
  // ones so different subcategory tiles don't duplicate the same photo).
  // This is what saves tiles like "Waterproofing" when the admin hasn't
  // added a literal "Waterproofing" service yet but the parent category
  // ("Painting | Renovation") has other services with real photos.
  if (!found && sub.category) {
    const parentNames = (Array.isArray(sub.category) ? sub.category : [sub.category])
      .map(normalize)
      .filter(Boolean);
    found = services.find((s) => {
      if (excludeIds.has(String(s._id))) return false;
      const c = normalize(s.category?.name);
      if (!c) return false;
      return parentNames.some((p) => c === p || c.includes(p) || p.includes(c));
    });
    // If every category-matching service was already used elsewhere, allow
    // reuse rather than falling back to the dark Unsplash placeholder.
    if (!found) {
      found = services.find((s) => {
        const c = normalize(s.category?.name);
        if (!c) return false;
        return parentNames.some((p) => c === p || c.includes(p) || p.includes(c));
      });
    }
  }

  return found || null;
};

/**
 * Urban Company-style category modal.
 *
 * Opens when a Home-Services tile is clicked, shows that category's
 * subcategories, and routes into the real /services catalog on select.
 * Subcategory routes are resolved against the live category list, so they
 * stay correct even after categories are renamed in the admin panel.
 *
 * Props:
 *  - data: { title, blurb, subcategories: [{ label, image, category }] } | null
 *  - onClose: () => void
 */
export default function ServiceModal({ data, onClose }) {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!data) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [data, onClose]);

  // Load the live categories once (first open) so subcategory clicks resolve
  // to the current, correct /services route — no hardcoded slugs.
  useEffect(() => {
    if (!data || categories.length) return;
    listCategories({ active: 'true' })
      .then(setCategories)
      .catch(() => {
        /* resolver gracefully falls back to /services */
      });
  }, [data, categories.length]);

  // Load the live service catalog so each subcategory tile shows the real
  // admin-uploaded service photo instead of the curated Unsplash fallback.
  useEffect(() => {
    if (!data || services.length) return;
    listServices({ limit: 200 })
      .then((list) => setServices(Array.isArray(list) ? list : []))
      .catch(() => {
        /* tiles fall back to their static sub.image — no toast on a popup */
      });
  }, [data, services.length]);

  // Precompute the resolved image per subcategory label. We walk subcategories
  // sequentially and exclude already-picked service IDs so two tiles in the
  // same modal don't render the same photo (esp. when several tiles share a
  // parent-category fallback like "Painting | Renovation").
  const liveImageByLabel = useMemo(() => {
    if (!data?.subcategories?.length) return {};
    const map = {};
    const used = new Set();
    for (const sub of data.subcategories) {
      const service = pickServiceForSub(services, sub, used);
      if (service) {
        used.add(String(service._id));
        map[sub.label] = resolveCatalogImage(service, null) || null;
      } else {
        map[sub.label] = null;
      }
    }
    return map;
  }, [data, services]);

  const navigate = useNavigate();

  const handlePick = (categoryName) => {
    onClose();
    navigate(resolveCategoryHref(categoryName, categories));
  };

  return (
    <AnimatePresence>
      {data && (
        <>
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
            aria-hidden
          />

          {/* Centered modal */}
          <div
            className="fixed inset-0 z-[121] flex items-center justify-center px-4 py-8 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={data.title}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="relative w-full max-w-lg rounded-3xl bg-paper shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] border border-ink/5 overflow-hidden"
            >
              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/5 hover:text-ink"
                aria-label="Close"
              >
                <X size={18} strokeWidth={1.75} />
              </button>

              {/* Header */}
              <div className="px-6 pt-7 pb-4 sm:px-8">
                <h2 className="heading-display text-2xl sm:text-3xl text-ink leading-tight">
                  {data.title}
                </h2>
                {data.blurb && (
                  <p className="mt-1.5 text-sm text-ink/55">{data.blurb}</p>
                )}
              </div>

              {/* Subcategory grid */}
              <div className="grid grid-cols-2 gap-3 px-6 pb-7 sm:grid-cols-3 sm:px-8">
                {data.subcategories.map((sub, i) => (
                  <motion.button
                    key={sub.label}
                    type="button"
                    onClick={() => handlePick(sub.category)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-paper text-left transition-all duration-300 hover:-translate-y-1 hover:border-ink/15 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                      <img
                        // Prefer the admin-uploaded service photo; fall through
                        // to the curated static image, then the global fallback
                        // via onError below.
                        src={liveImageByLabel[sub.label] || sub.image}
                        alt={sub.label}
                        loading="lazy"
                        onError={(e) => {
                          // Cascade: live → curated static → generic fallback.
                          if (
                            liveImageByLabel[sub.label] &&
                            e.currentTarget.src.indexOf(sub.image) === -1
                          ) {
                            e.currentTarget.src = sub.image;
                          } else {
                            e.currentTarget.src = SUBCATEGORY_FALLBACK_IMAGE;
                          }
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1.5 p-3">
                      <span className="text-[12px] sm:text-[13px] font-semibold leading-snug text-ink">
                        {sub.label}
                      </span>
                      <ArrowRight
                        size={14}
                        className="shrink-0 text-ink/35 transition-colors group-hover:text-[#6f5cff]"
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
