/**
 * Generates the correct URL to navigate to the Services page filtered by a specific category.
 *
 * @param {Object|string} categoryIdentifier - The category object (containing a slug) or the slug string directly.
 * @returns {string} The fully formatted URL path.
 */
export function getCategoryLink(categoryIdentifier) {
  if (!categoryIdentifier) return '/services';
  
  // Extract slug if an object was provided
  const slug = typeof categoryIdentifier === 'object' ? categoryIdentifier.slug : categoryIdentifier;
  
  if (!slug) return '/services';
  
  // Return the query parameter URL to ensure ServicesIndex correctly initializes its state
  return `/services?cat=${encodeURIComponent(slug)}`;
}
