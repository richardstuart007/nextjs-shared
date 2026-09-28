'use client'

//==============================================================================================
//  1) DESCRIPTION
//    saveBackNav — stores `path` under `key`; call before navigating away. When
//    `path` is omitted, stores the current path + search. Pass `path` explicitly to
//    forward an already-known back-target (chained navigation) instead of the
//    current URL.
//
//    Parameters:
//      key  — sessionStorage key; must be unique per call site (include the source
//             page's identity if more than one page can navigate to the same target)
//      path — optional explicit back-target; omitted, captures the current URL
//
//  3) CHANGE HISTORY
//    2026-09-28 — split out of useBackNav.ts (one-export-per-file cleanup); no
//                 signature change
//==============================================================================================

import { SessionStorageKeyPrefixShared } from '../constants'

export function saveBackNav(key: string, path?: string) {
  sessionStorage.setItem(
    SessionStorageKeyPrefixShared + key,
    path ?? window.location.pathname + window.location.search
  )
}
