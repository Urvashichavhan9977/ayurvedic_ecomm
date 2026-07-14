// Shared fallback for any product/media image that is missing or fails to
// load, so cards never show a broken-image icon. Encoded inline (no network
// request, no extra asset file) so it always works offline too.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f2f7f4'/%3E%3Cg fill='none' stroke='%23c9d8cd' stroke-width='10'%3E%3Ccircle cx='200' cy='160' r='55'/%3E%3Cpath d='M70 330c15-70 75-120 130-120s115 50 130 120' /%3E%3C/g%3E%3Ctext x='200' y='365' font-family='sans-serif' font-size='16' fill='%239bb3a1' text-anchor='middle'%3EImage coming soon%3C/text%3E%3C/svg%3E"

/** Attach to an <img onError={...}> to swap in the placeholder once, without looping. */
export function handleImageError(e) {
  if (e.target.dataset.fallbackApplied) return
  e.target.dataset.fallbackApplied = 'true'
  e.target.src = PLACEHOLDER_IMAGE
}
