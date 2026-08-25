//==============================================================================================
//  1) DESCRIPTION
//    getWidthNumber — maps the current window width to a breakpoint tier (1-5),
//    matching Tailwind's default sm/md/lg/xl/2xl breakpoints
//
//    Returns:
//      1 (<768px) through 5 (>=1536px)
//==============================================================================================
export function getWidthNumber(): number {
  const w = window.innerWidth
  if (w >= 1536) return 5
  if (w >= 1280) return 4
  if (w >= 1024) return 3
  if (w >= 768) return 2
  return 1
}
