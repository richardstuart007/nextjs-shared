'use client';

//==============================================================================================
//  1) DESCRIPTION
//    useLazyFetch — fetches on mount (or on demand via `load()`), tracking
//    data/loaded/loading/error state, re-fetching whenever `deps` changes. Guards against a
//    stale in-flight fetch overwriting state from a newer `deps` value.
//
//    Parameters:
//      fetchFn — the async function to call; its resolved value becomes `data`
//      deps    — like useEffect's dependency array; changing any value resets state and
//                triggers a re-fetch (unless autoFetch is false)
//      options.autoFetch — defaults to true; pass false to defer the first fetch until
//                          `load()` is called manually
//
//    Returns:
//      data    — the last successfully fetched value, or null before any fetch has succeeded
//      loaded  — true once a fetch has completed successfully; reset to false on every deps
//                change
//      loading — true while a fetch is in flight
//      error   — the caught error from the most recent failed fetch, or null
//      load    — re-runs fetchFn on demand (e.g. a "Refresh" button); also used internally to
//                drive the automatic fetch
//
//  3) CHANGE HISTORY
//    2026-08-25 — new hook: fetches on mount/deps-change; tracks data/loaded/loading/error;
//                 discards a stale in-flight request's result if a newer one has since started
//==============================================================================================

import { useEffect, useRef, useState } from 'react';

export function useLazyFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[],
  options?: { autoFetch?: boolean },
): {
  data: T | null;
  loaded: boolean;
  loading: boolean;
  error: unknown;
  load: () => Promise<void>;
} {
  //
  //  autoFetch defaults to true — the hook fetches on mount/deps-change unless the
  //  caller opts out to defer the first fetch until load() is called manually
  //
  const autoFetch = options?.autoFetch ?? true;

  const [data, setData] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  //----------------------------------------------------------------------------------------------
  //  Fetch on mount and whenever deps changes
  //----------------------------------------------------------------------------------------------
  //
  //  requestIdRef is a monotonically increasing counter identifying the most
  //  recent fetch request. Each load() call, and each deps-change effect run,
  //  claims a new id — a resolving fetch checks its own id against the current
  //  one before applying its result, so a stale/superseded fetch's result is
  //  discarded instead of overwriting state from a newer request
  //
  const requestIdRef = useRef(0);

  useEffect(() => {
    //
    //  Bump the request id first so any fetch still in flight from the previous
    //  deps value is invalidated — its late-arriving result will fail the id
    //  check below and be discarded instead of overwriting the reset below
    //
    requestIdRef.current++;

    //
    //  Reset all state for the new deps value before (optionally) fetching again
    //
    setLoaded(false);
    setData(null);
    setError(null);
    setLoading(false);

    if (autoFetch) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  //----------------------------------------------------------------------------------------------
  //
  //  Function return values
  //
  return { data, loaded, loading, error, load };

  //----------------------------------------------------------------------------------------------
  //  load — runs fetchFn, applying its result only if no newer request has started since
  //----------------------------------------------------------------------------------------------
  async function load() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();

      //
      //  A newer request has since started (another load() call, or a deps
      //  change) — this result is stale, discard it rather than applying it
      //
      if (requestId !== requestIdRef.current) return;

      setData(result);
      setLoaded(true);
      setLoading(false);
    } catch (err) {
      //
      //  Same staleness check on the error path — an old failed request must
      //  not overwrite state belonging to a newer, still in-flight request
      //
      if (requestId !== requestIdRef.current) return;

      setError(err);
      setLoading(false);
    }
  }
}
