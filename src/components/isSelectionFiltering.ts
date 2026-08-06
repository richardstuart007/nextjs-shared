//----------------------------------------------------------------------------------
//  isSelectionFiltering — true only when `selected` is a genuine partial selection.
//  Both extremes (nothing selected, everything selected) mean "no filter" — MySelectMulti
//  reports the identical full-array value whether the user reached it by checking every
//  box by hand or via the built-in "select all" row, so callers should treat them the same.
//----------------------------------------------------------------------------------
export function isSelectionFiltering(selected: string[], totalOptions: number): boolean {
  return selected.length > 0 && selected.length < totalOptions
}

//----------------------------------------------------------------------------------
//  SELECTION_ALL / serializeSelection — sentinel for persisting a MySelectMulti's "no
//  filter" state (e.g. to sessionStorage) instead of a literal snapshot of every
//  currently-selected value. A literal snapshot goes stale as soon as the underlying
//  option list grows (a new club/grade/etc. appears) — the old array no longer covers
//  every current option, so isSelectionFiltering starts reporting a genuine partial
//  filter on reload, silently excluding the new value from what should still be "all."
//  The sentinel has no such staleness: restoring it means "select whatever the full
//  option list is right now," always.
//----------------------------------------------------------------------------------
export const SELECTION_ALL = 'all'

export function serializeSelection(
  selected: string[],
  totalOptions: number
): typeof SELECTION_ALL | string[] {
  return isSelectionFiltering(selected, totalOptions) ? selected : SELECTION_ALL
}
