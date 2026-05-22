export function getWidthNumber(): number {
  const w = window.innerWidth
  if (w >= 1536) return 5
  if (w >= 1280) return 4
  if (w >= 1024) return 3
  if (w >= 768) return 2
  return 1
}
