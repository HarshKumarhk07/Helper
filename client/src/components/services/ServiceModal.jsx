import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { SUBCATEGORY_FALLBACK_IMAGE, resolveCategoryHref } from '../../data/servicesData.js';
import { listCategories } from '../../api/categories.js';

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
                        src={sub.image}
                        alt={sub.label}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = SUBCATEGORY_FALLBACK_IMAGE;
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
