'use client'

//==============================================================================================
//  1) DESCRIPTION
//    useTabQueryState — syncs a tabbed component's active tab to a URL query param, via nuqs
//    (shallow update, no scroll jump, restored from the URL on load)
//
//    Parameters:
//      paramName    — the URL query key (e.g. 'tab')
//      defaultValue — used when the param is absent; also the value that clears the param
//                     from the URL when set back to it (nuqs clearOnDefault)
//
//    Returns:
//      nuqs's own [value, setValue] tuple — setValue accepts a new string or an updater
//      function, same as useState
//==============================================================================================

import { useQueryState, type UseQueryStateReturn } from 'nuqs'

export function useTabQueryState(
  paramName: string,
  defaultValue: string,
): UseQueryStateReturn<string, string> {
  const tabState = useQueryState(paramName, { defaultValue })
  return tabState
}
