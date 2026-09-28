//==============================================================================================
//  1) DESCRIPTION
//    isAheadOfLatest — whether a project's declared version spec is newer than npm's `latest`
//    dist-tag, using the `semver` package so prereleases rank correctly
//    (5.0.0-beta.32 > 4.24.15, but 5.0.0-beta.32 < 5.0.0).
//
//    Parameters:
//      spec   — the project's declared package.json spec, e.g. '5.0.0-beta.32' or '^1.2.3'
//      latest — npm's latest version for the package, e.g. '4.24.15'
//
//    Returns:
//      true when the lowest version `spec` allows is greater than `latest`; false otherwise,
//      including when either value isn't a parseable version/range (e.g. '?' for a failed lookup)
//
//  2) NOTES
//    Shared by OwnerSyncVersions.tsx (row display) and OwnerSyncVersions_actions.ts (Sync) so
//    the "Sync never downgrades to npm latest" rule is one piece of logic, not two copies.
//
//  3) CHANGE HISTORY
//    2026-09-28 — new helper: stops Sync falling back to npm latest when a project is ahead
//                 (e.g. on a beta line not yet published as latest)
//==============================================================================================

import semver from 'semver'

export function isAheadOfLatest(spec: string, latest: string): boolean {
  const specRange = semver.validRange(spec)
  const latestVer = semver.valid(latest)
  if (specRange === null || latestVer === null) return false
  const specMin = semver.minVersion(specRange)
  if (specMin === null) return false
  const ahead = semver.gt(specMin, latestVer)
  return ahead
}
