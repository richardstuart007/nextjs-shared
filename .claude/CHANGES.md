# Changes — nextjs-shared, "version": "2.0.5"

## src/UI/OwnerSyncVersions_actions.ts
- Phase 2: when writing a target to `overrides`, now also removes that package from `dependencies`, `devDependencies`, and `peerDependencies` — override is the sole source of truth
- Phase 2: `isInProject` check now also matches packages already in `overrides`, so projects where the dep was previously removed still get their override normalised to the current target
- Delete loop: when removing an override (target cleared), restores the package to `dependencies` at npm latest so it is not lost entirely

## package.json
- Removed `pg` from `peerDependencies` — it is already in `dependencies` so the peer entry was redundant and caused spurious warnings in consuming projects
