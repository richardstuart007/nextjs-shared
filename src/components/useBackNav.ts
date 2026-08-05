'use client'

import { useEffect, useRef, useState } from 'react'
import { SessionStorageKeyPrefixShared } from '../constants'

//----------------------------------------------------------------------------------
//  saveBackNav — stores `path` under `key`; call before navigating away. When `path` is
//  omitted, stores the current path + search. Pass `path` explicitly to forward an
//  already-known back-target (chained navigation) instead of the current URL.
//----------------------------------------------------------------------------------
export function saveBackNav(key: string, path?: string) {
  sessionStorage.setItem(
    SessionStorageKeyPrefixShared + key,
    path ?? window.location.pathname + window.location.search
  )
}

//----------------------------------------------------------------------------------
//  useBackNav — reads and clears the path stored under `key` on mount
//----------------------------------------------------------------------------------
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
