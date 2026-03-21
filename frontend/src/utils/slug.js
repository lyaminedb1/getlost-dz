/**
 * Generate a URL-friendly slug from a title + id
 * "Zanzibar Paradise" + 1 → "zanzibar-paradise-1"
 */
export function toSlug(title, id) {
  const base = (title || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')                     // remove special chars
    .replace(/\s+/g, '-')                               // spaces → hyphens
    .replace(/-+/g, '-')                                // collapse hyphens
    .replace(/^-|-$/g, '')                              // trim hyphens
    .slice(0, 60)
  return `${base}-${id}`
}

/**
 * Extract ID from a slug: "zanzibar-paradise-1" → 1
 */
export function fromSlug(slug) {
  const parts = (slug || '').split('-')
  const id = parseInt(parts[parts.length - 1])
  return isNaN(id) ? null : id
}
