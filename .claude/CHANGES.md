# Changes — nextjs-shared, "version": "2.1.3"

## src/components/MyButton.tsx, MyInput.tsx, MyTextarea.tsx, MySelect.tsx, MyLink.tsx, MyBox.tsx, MyToggle.tsx, MyPopup.tsx, MyHourGlass.tsx, MyDropdown.tsx — project-level default class support
- Renamed exported default class constant from `defaultClass` → `My{X}_dftClass_Shared` (MyDropdown: `defaultDropdownClass` → `MyDropdown_dftClass_Shared`; MyPopup: `defaultPanelClass` → `MyPopup_dftClass_Shared`)
- Added optional `defaultClass?: string` prop to each component, defaulting to the renamed shared constant — consuming projects can now pass a project-level default class without any wrapper logic needed in the library
- Renamed local `classValue` → `className` throughout (const named after the HTML prop it maps to); MyBox uses destructuring alias `className: overrideClass` to free the `className` name for the computed result; MyDropdown keeps `className_Dropdown` (multiple class merges in one function)
- MyInput, MyTextarea: added `'use client'`, converted `interface Props extends` → `type Props =`, added function comment headers
- All changes are backward-compatible — `defaultClass` prop is optional; callers that don't pass it get the shared default unchanged

## src/UI/OwnerComponentTest.tsx — updated imports for renamed constants
- Updated all 10 import aliases to use new `My{X}_dftClass_Shared` names throughout

## src/components/MyPagination.tsx
- Removed dead `'middle'` position branches from `PaginationNumber` — `'...'` items are intercepted before the component is called
- Fixed ellipsis div sizing to match `PaginationNumber` responsive classes (`h-5 md:h-6 w-5 md:w-6 text-xxs md:text-xs`)
- Moved `generatePagination` to module level (bottom, top-down) — was recreated every render
- Moved `PaginationNumber` and `PaginationArrow` to module level — React was treating them as new types every render
- Added `overrideClass` prop with `myMergeClasses` on the wrapper div

## src/components/MyConfirmDialog.tsx
- Replaced `bg-secondary-light text-secondary-main` with standard Tailwind `bg-red-100 text-red-600`
- Added 6 override props with defaults: `iconContainerClass`, `titleClass`, `subTitleClass`, `lineClass`, `noButtonClass`, `yesButtonClass`
- Extracted `interface` to `type Props`
- All hardcoded inline classes now reachable by callers
- Added `view` const before return

## src/components/MyBox.tsx (responsive defaults)
- defaultClass converted to joined array; reordered: rounded-lg → border → spacing → margin
- `p-3` → `p-2 md:p-3`

## src/components/MyToggle.tsx (responsive defaults)
- Reordered: `rounded-full` moved before `bg-gray-400` (shape before background); after: groups kept together

## src/components/MyPopup.tsx (responsive defaults)
- defaultPanelClass converted to joined array; reordered: layout → size → spacing → shape → background → shadow → scroll
- `p-6` → `p-4 md:p-6`

## src/components/MyHourGlass.tsx (responsive defaults)
- defaultClass converted to joined array
- `text-4xl` → `text-2xl md:text-4xl`

## src/components/MyLoadingMessage.tsx (responsive defaults)
- `py-8` → `py-4 md:py-8` in containerClass default

## src/components/MyButton.tsx / MyLink.tsx / MyInput.tsx / MyTextarea.tsx / MySelect.tsx / MyDropdown.tsx (responsive defaults)
- All form elements: `h-6` → `h-6 md:h-8` (responsive height); MyTextarea keeps `h-24`
- All form elements: `px-2` → `px-1 md:px-2` (responsive padding)
- All defaults reordered to consistent group order: layout → size → spacing → typography → shape → border → background → animation → focus/hover states → disabled states
- MyInput/MyTextarea: removed stray `items-center` (has no effect on non-flex element)
- MyInput/MyTextarea: `border border-blue-500 rounded-md` split into separate `rounded-md` and `border border-blue-500` lines

## src/components/MySelect.tsx (defaults pass 2)
- `text-sm` → `text-xs` to match all other form elements
- `h-6` added for explicit height
- `focus:outline-none focus:ring-1 focus:ring-blue-500` → `focus:border-1 focus:border-blue-500` to match MyInput/MyTextarea
- Added `hover:border-blue-500`, `transition-colors`, `aria-disabled:cursor-not-allowed aria-disabled:opacity-50`

## src/components/MyDropdown.tsx (defaults pass 2)
- Converted `defaultDropdownClass` from single string to joined array
- Added `h-6` for explicit height
- Added `focus:border-1 focus:border-blue-500`, `hover:border-blue-500`, `transition-colors`, `aria-disabled:cursor-not-allowed aria-disabled:opacity-50`

## src/components/MyConfirmDialog.tsx (defaults pass 2)
- `noButtonClass` and `yesButtonClass` defaults: `rounded` → `rounded-md` to match MyButton convention

## src/UI/OwnerComponentTest.tsx (5 new tabs + defaults fix)
- Added MyPopupTab, MyHourGlassTab, MyHelpTab, MyHelpFieldTab, MyHelpStepTab
- Fixed `noButtonClass`/`yesButtonClass` defaults in `dialogDefaults` to use `rounded-md`

## src/components/MyHourGlass.tsx
- Added `'use client'`
- Added `type Props`, `overrideClass` prop, and `myMergeClasses`
- Exported `defaultClass`
- Added function comment header

## src/components/MyHelp.tsx
- Extracted inline prop type to named `type Props`
- Added function comment header
- Added `buttonClass` and `panelClass` override props with defaults

## src/components/MyHelpField.tsx
- Extracted inline prop type to named `type Props`
- Added function comment header
- Added `triggerClass` and `tooltipClass` override props with defaults

## src/components/MyHelpStep.tsx
- Added function comment header
- Added `buttonClass` and `panelClass` override props to `MyHelpStepProps`

## src/components/MyLoadingMessage.tsx
- Added `'use client'`
- `interface` → `type Props`
- Added function comment header
- Added `containerClass` override prop (default: `py-8 text-center`)
- Added `messageClass` override prop shared by both paragraphs (default: `text-xl font-bold text-red-600`)

## src/UI/OwnerComponentTest.tsx (MySelect + MyToggle tabs)
- Added MySelectTab: label, comma-separated options, overrideClass, labelClass, containerClass inputs; shows selected value and className in Returns
- Added MyToggleTab: inputName, inputValue start, overrideClass, labelClass inputs; shows live boolean value and className in Returns

## src/components/MyToggle.tsx
- Added `'use client'`
- `interface Props extends` → `type Props =` with `&`
- Moved `defaultClass` to module level and exported it
- Added function comment header
- Removed obvious inline comments
- Added `labelClass` override prop (default: `inline-flex items-center cursor-pointer`)

## src/components/MySelect.tsx
- `interface Props extends` → `type Props =` with `&`
- Moved `defaultClass` to module level and exported it
- Added function comment header
- Added `containerClass` override prop (default: `flex items-center gap-2`) — wrapper div was previously hardcoded

## src/components/MyPopup.tsx
- Added `'use client'`
- `interface` → `type Props`
- Replaced `maxWidth` prop with `overrideClass` (main panel div) using `myMergeClasses`
- Added `overlayClass` and `closeButtonClass` override props with defaults
- Exported `defaultPanelClass` for test harness
- Added function comment header

## src/UI/OwnerTableCache.tsx
- Updated `MyPopup` call: `maxWidth=` → `overrideClass=`

## Consumer impact: next-bridgeschool (6 files)
- questions/answers/formPopup.tsx — `maxWidth=` → `overrideClass=`
- questions/bidding/formPopup.tsx — `maxWidth=` → `overrideClass=`
- questions/hands/formPopup.tsx — `maxWidth=` → `overrideClass=`
- questions/tablePopup.tsx — `maxWidth=` → `overrideClass=`
- reference/tablePopup.tsx — `maxWidth=` → `overrideClass=`
- usersowner/tablePopup.tsx — `maxWidth=` → `overrideClass=`
- Requires reinstall in next-bridgeschool after push

## src/UI/OwnerComponentTest.tsx (MyConfirmDialog overrides)
- Added all 6 override class fields to `DialogControlProps` and `dialogDefaults`
- Added control rows for each override in the Props column
- Passed override props through to `MyConfirmDialog` in the Display column

## src/UI/OwnerComponentTest.tsx (rest props + defaults)
- Added `parseRestProps` helper — parses `key="value"` pairs into a props object for spreading
- Added `restProps` field to `BtnProps`, `InputProps`, `TextareaProps`, `LinkControlProps`
- Added rest props textarea (h-16) to MyButton, MyInput, MyTextarea, MyLink tabs
- Spread `parseRestProps(applied.restProps)` onto each component in Display column
- Show parsed rest props in Returns column
- Restored sensible default values for all tabs (label, title, placeholder, etc.)
- Default `restProps` is `aria-disabled="true"` to make the feature immediately testable

## src/components/MyLink.tsx
- `interface` → `type` for `LinkHref` and `Props`
- Moved `defaultClass` to module level and exported it
- Added function comment header
- Removed obvious inline comments; kept 3-line block comment on href building
- `return <Link ...>` → assigned to `view` const first

## src/UI/OwnerComponentTest.tsx (MyLink tab)
- Added `MyLinkTab` with label, pathname, and overrideClass inputs
- Added `MyLink` import with `defaultClass as linkDefaultClass`
- Registered as new tab in `OwnerComponentTest`

## src/components/MyMergeClasses.ts (3rd change)
- Fixed append logic: overrides that match the same default as another override were being silently dropped. Changed `additionalOverrides` filter to check `!updatedClassArray.includes(overrideCls)` — if an override was used as a replacement it's already in the updated array; if not, it appends

## src/components/MyMergeClasses.ts (2nd change)
- Added `outline-` to `patternsToReplace` — `focus-visible:outline-red-500` now correctly replaces `focus-visible:outline-blue-500` instead of appending

## src/components/MyMergeClasses.ts
- Expanded `patternsToReplace` from 6 to 20 entries — added full padding/margin families, size bounds, and common utilities; `p-` was the critical gap
- Converted four `const` arrow helpers to `function` declarations
- Moved all helpers to module level below `myMergeClasses` (top-down structure); `TEXT_SIZES` moved to module level
- Added named const before all direct function-call returns
- Added 3-line `//` block comments to all inline comment blocks

## src/components/MyBox.tsx
- Replaced template literal class concatenation with `myMergeClasses` — callers overriding `p-3` or `mb-3` now get proper replacement
- `interface` → `type`
- Extracted `defaultTitleClass` to top-level `const`
- Added function comment header
- Computed `classValue` before JSX return

## src/components/MyButton.tsx
- Added `'use client'`
- `interface Props extends` → `type Props =` with `&` intersection
- Moved `defaultClass` to module-level `const`
- Added function comment header
- Removed redundant `// Use the mergeClasses function...` comment

## src/UI/OwnerComponentTest.tsx + src/app/owner/components/page.tsx
- New visual test page at localhost:3009/owner/components
- Tests MyButton, MyInput, MyTextarea, MyBox, MyDropdown, MyCheckBox, MyPagination, MyConfirmDialog
- Uses static data for MyDropdown (no DB needed); MyCheckBox limited to 3 selections with search

## src/components/MyDropdown.tsx
- Added `'use client'`
- Added component comment header
- Fixed section headers to 94-dash indented format
- Moved `functionName` to module-level const
- Grouped all `useState` declarations first (`loading` was after two useMemos)
- `useCallback(async function() {...})` converted to arrow callback
- `useMemo` callbacks now assign to `result` const before returning
- Removed `const fetchParams: any` — now typed directly with `as table_fetch_Props`
- Replaced `console.error` with `await write_logging` (severity `'E'`)
- Final return statements now assign to `view` const before returning

## src/components/MyConfirmDialog.tsx
- Added `'use client'`
- Both `interface` declarations converted to `type`
- `ConfirmDialogProps` inlined into the function signature — removes the intermediate type
- Added function comment header
- End-of-line `// remove nulls, assert type` comment extracted to 3-line block above the expression
- Six `line !== undefined ? line : null` ternaries replaced with `?? null`

## src/components/MyCheckbox.tsx
- Added `'use client'`
- Removed stale path comment on line 1
- Fixed comment headers to 94-dash indented format
- Converted all `function()` inline callbacks to arrow functions
- `sortFn` converted from `const function()` to `function` declaration
- Added named const before direct function-call returns in `isSelected`, `sortSelected`, `renderHiddenInputs`, `sortedOptions`, `filteredOptions`, and main return
- Removed `// Add sortBy prop` task note comment
- Replaced `myMergeClasses('...', '')` with plain string for `className_ResortButton`
- Reformatted single-line `//` comments to 3-line block format
