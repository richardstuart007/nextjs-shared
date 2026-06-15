# Changes — nextjs-shared, "version": "2.0.5"

## src/UI/OwnerSyncVersions_actions.ts
- Phase 2: when writing a target to `overrides`, now also removes that package from `dependencies`, `devDependencies`, and `peerDependencies` — override is the sole source of truth
- Delete loop: when removing an override (target cleared), restores the package to `dependencies` at npm latest so it is not lost entirely
