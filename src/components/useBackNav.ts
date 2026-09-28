'use client'

import { useEffect, useRef, useState } from 'react'
import { SessionStorageKeyPrefixShared } from '../constants'

export { saveBackNav } from './saveBackNav'

//==============================================================================================
//  1) DESCRIPTION
//    useBackNav — reads and clears the path stored under `key` on mount.
//
//    Parameters:
//      key — sessionStorage key; must match the key passed to saveBackNav
//
//    Returns:
//      the stored path, or null if nothing was stored under key (or once already
//      read)
//
//  2) NOTES
//    React Strict Mode double-invokes effects in dev — the effect below guards so
//    the destructive read-and-clear only ever runs once per mount, not twice (see
//    the inline comment on readRef).
//    This file also re-exports `saveBackNav` (see saveBackNav.ts) for existing
//    consumers, including next-bridge's `nextjs-shared/useBackNav` imports.
//
//  3) CHANGE HISTORY
//    2026-09-28 — saveBackNav moved to its own file; re-exported here for existing
//                 consumers
//==============================================================================================
export function useBackNav(key: string): string | null {
  const [backPath, setBackPath] = useState<string | null>(null)
  const readRef = useRef(false)

  //
  //  React Strict Mode double-invokes effects in dev — guard so the destructive
  //  read-and-clear only ever runs once per mount, not twice
  //
  useEffect(() => {
    if (readRef.current) return
    readRef.current = true
    const prefixedKey = SessionStorageKeyPrefixShared + key
    const stored = sessionStorage.getItem(prefixedKey)
    sessionStorage.removeItem(prefixedKey)
    setBackPath(stored)
  }, [key])

  return backPath
}
