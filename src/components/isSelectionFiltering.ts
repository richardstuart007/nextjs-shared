//----------------------------------------------------------------------------------
//  isSelectionFiltering — true only when `selected` is a genuine partial selection.
//  Both extremes (nothing selected, everything selected) mean "no filter" — MySelectMulti
//  reports the identical full-array value whether the user reached it by checking every
//  box by hand or via the built-in "select all" row, so callers should treat them the same.
//----------------------------------------------------------------------------------
export function isSelectionFiltering(selected: string[], totalOptions: number): boolean {
  return selected.length > 0 && selected.length < totalOptions
}
