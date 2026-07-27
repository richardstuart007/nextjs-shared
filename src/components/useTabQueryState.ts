'use client'

import { useQueryState, type UseQueryStateReturn } from 'nuqs'

//----------------------------------------------------------------------------------
//  useTabQueryState — syncs a tabbed component's active tab to a URL query param,
//  via nuqs (shallow update, no scroll jump, restored from the URL on load)
//----------------------------------------------------------------------------------
export function useTabQueryState(
  paramName: string,
  defaultValue: string,
): UseQueryStateReturn<string, string> {
  const tabState = useQueryState(paramName, { defaultValue })
  return tabState
}
