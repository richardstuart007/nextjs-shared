//----------------------------------------------------------------------------------
//  isSelectionFiltering — true only when `selected` is a genuine partial selection.
//  Both extremes (nothing selected, everything selected) mean "no filter" — MySelectMulti
//  reports the identical full-array value whether the user reached it by checking every
//  box by hand or via the built-in "select all" row, so callers should treat them the same.
//
//  Params:
//    selected     — the currently-selected values
//    totalOptions — the full option list's length
//
//  Returns:
//    true only when selected is non-empty and not the full option list
//
//  Usage: when deciding whether a MySelectMulti selection should filter a query, always
//  use this helper — never derive it with an ad hoc check (`.length > 0`,
//  `.length < options.length`, or similar), since a caller re-deriving the "no filter"
//  rule by hand risks getting the both-extremes case wrong:
//
//    if (isSelectionFiltering(selectedClubs, clubOptions.length)) {
//      params.set('clubs', selectedClubs.join(','))
//    }
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

//----------------------------------------------------------------------------------
//  serializeSelection — converts a selection to its persistable form, collapsing a
//  "select everything" selection down to the SELECTION_ALL sentinel
//
//  Params:
//    selected     — the currently-selected values
//    totalOptions — the full option list's length
//
//  Returns:
//    the selected array as-is when it's a genuine partial filter, otherwise SELECTION_ALL
//
//  Usage — persisting a MySelectMulti selection (e.g. to sessionStorage) across reloads.
//  Never persist a literal snapshot of `selected` directly; serialize it through this
//  function, and restore SELECTION_ALL back to the current full option list (not a
//  frozen array) on read:
//
//    sessionStorage.setItem('clubs', JSON.stringify(serializeSelection(selectedClubs, clubOptions.length)))
//
//    const stored = JSON.parse(sessionStorage.getItem('clubs') ?? 'null')
//    const restored = stored === SELECTION_ALL ? clubOptions.map(o => o.value) : (stored ?? [])
//----------------------------------------------------------------------------------
export function serializeSelection(
  selected: string[],
  totalOptions: number
): typeof SELECTION_ALL | string[] {
  return isSelectionFiltering(selected, totalOptions) ? selected : SELECTION_ALL
}
