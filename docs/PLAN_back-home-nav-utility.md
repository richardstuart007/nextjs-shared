# Plan: Generic MyBackHomeNav utility

## Plan
- [x] Create `src/components/MyBackHomeNav.tsx` — generic Home/Back link bar with `backPath`,
      `homePath`, `containerClass`, `linkClass` props. Home always renders; back renders only when
      `backPath` is provided and differs from `homePath`.
- [x] Refactor `src/UI/OwnerLayout.tsx` to render `MyBackHomeNav` instead of the inline `<a>` tags,
      keeping its existing sessionStorage/pathname back-path logic unchanged.
- [x] Add `"./MyBackHomeNav": "./src/components/MyBackHomeNav.tsx"` to `package.json` exports.
- [x] Document `MyBackHomeNav` in `CONSUMING_PROJECTS.md` (component table + usage example) so
      other projects can adopt it in place of hardcoded back buttons.

## Changes

### src/components/MyBackHomeNav.tsx
- New generic component: renders a Home link (`homePath`, default `/`) always, and a Back link
  (`backPath`) only when supplied and different from `homePath`.
- Exposes `containerClass`/`linkClass` override props with named default-class constants, following
  the sub-element override convention used elsewhere (e.g. `MySelect`'s `labelClass`).

### src/UI/OwnerLayout.tsx
- Replaced the inline Home/Back `<a>` tags with `<MyBackHomeNav backPath={backPath} />`. No change
  to the sessionStorage/pathname logic that computes `backPath`.

### package.json
- Added `./MyBackHomeNav` export entry.

### CONSUMING_PROJECTS.md
- Added `MyBackHomeNav` to the UI Components table.
- Added a "MyBackHomeNav — replacing hardcoded back buttons" usage section with props and the
  owner-route caveat (don't render it manually on `/owner` pages — `OwnerLayout` already does).
